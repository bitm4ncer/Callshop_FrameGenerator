// OneDrive Integration Configuration
const clientId = 'YOUR_MICROSOFT_APP_CLIENT_ID';
const redirectUri = 'YOUR_REDIRECT_URI'; // z.B. https://yourdomain.com/auth
const scopes = ['files.readwrite', 'offline_access'];

// Authentication State
let accessToken = null; 

// Initialisieren der OneDrive-Integration
function initOneDriveIntegration() {
  // OneDrive-Button Event Listener
  $("#uploadToOneDriveButton").on("click", uploadToOneDrive);
  
  // Prüfen, ob bereits ein Token im Session Storage vorhanden ist
  const storedToken = sessionStorage.getItem('oneDriveToken');
  if (storedToken) {
    accessToken = storedToken;
  }
}

// Authentifizierung bei Microsoft Graph API
function authenticateWithMicrosoftGraph() {
  return new Promise((resolve, reject) => {
    if (accessToken) {
      resolve(accessToken);
      return;
    }
    
    // OAuth 2.0 Implicit Flow
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes.join(' '))}&response_mode=fragment`;
    
    // Öffnen eines Popup-Fensters für die Authentifizierung
    const authWindow = window.open(authUrl, '_blank', 'width=800,height=600');
    
    // Event-Listener für Nachrichten vom Popup-Fenster
    window.addEventListener('message', (event) => {
      if (event.origin !== window.location.origin) return;
      
      const { token } = event.data;
      if (token) {
        accessToken = token;
        sessionStorage.setItem('oneDriveToken', token);
        authWindow.close();
        resolve(token);
      }
    }, false);
  });
}

// Upload zur OneDrive
async function uploadToOneDrive() {
  try {
    // Exportieren der aktuellen Vorschau als Blob
    const previewBlob = await getExportBlob();
    if (!previewBlob) {
      alert('Bitte zuerst ein Bild generieren');
      return;
    }
    
    // Authentifizieren
    const token = await authenticateWithMicrosoftGraph();
    
    // Dateiname generieren
    const values = getFormValues();
    const [year, month, day] = values.date.split('-');
    const formattedDate = `${year}_${month}_${day}`;
    const fileName = `${formattedDate}_${values.show}${values.artist ? '_' + values.artist : ''}.webp`;
    
    // Upload zur OneDrive starten
    $("#uploadToOneDriveButton").text("Uploading...").prop("disabled", true);
    
    // Upload-Request
    const uploadUrl = 'https://graph.microsoft.com/v1.0/me/drive/root:/CALLSHOP.RADIO/' + fileName + ':/content';
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'image/webp'
      },
      body: previewBlob
    });
    
    if (response.ok) {
      const result = await response.json();
      $("#uploadToOneDriveButton").text("Uploaded!").addClass("success");
      
      setTimeout(() => {
        $("#uploadToOneDriveButton").text("Upload to OneDrive").removeClass("success").prop("disabled", false);
      }, 3000);
      
      console.log("File uploaded successfully:", result);
    } else {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error uploading to OneDrive:", error);
    $("#uploadToOneDriveButton").text("Failed!").addClass("error");
    
    setTimeout(() => {
      $("#uploadToOneDriveButton").text("Upload to OneDrive").removeClass("error").prop("disabled", false);
    }, 3000);
    
    alert("Failed to upload to OneDrive. Please try again later.");
  }
}

// Hilfsfunktion zum Abrufen des Export-Blobs
function getExportBlob() {
  return new Promise((resolve) => {
    const blueprint = blueprints[currentBlueprint];
    const $bp = $("#exportContainer " + blueprint.container);
    const dimensions = blueprint.dimensions;
    
    // Dimensions für das Rendering setzen
    $bp.css({
      width: dimensions.width + 'px',
      height: dimensions.height + 'px'
    });
    
    html2canvas($bp[0], {
      width: dimensions.width,
      height: dimensions.height,
      scale: 1,
      useCORS: true,
      logging: false,
      backgroundColor: "#222"
    }).then(canvas => {
      // Blob mit hoher Qualität erzeugen
      canvas.toBlob(blob => {
        // Reset element dimensions
        $bp.css({
          width: '',
          height: ''
        });
        
        resolve(blob);
      }, 'image/webp', 1.0);
    }).catch(error => {
      console.error("Error generating blob:", error);
      resolve(null);
    });
  });
}

// Initialisierung bei Dokumentenbereitschaft
$(document).ready(() => {
  // Vorhandene Initialisierungen...
  
  // OneDrive-Integration initialisieren
  initOneDriveIntegration();
}); 