let uploadedImage = "";
let previewTimeout;
let currentBlueprint = "original";
const blueprints = {
  original: {
    template: "blueprint_social.html",
    container: "#blueprint",
    scale: 2
  },
  square: {
    template: "blueprint_square.html",
    container: "#blueprint_square",
    scale: 2
  }
};

// Add these variables at the top
let socialSaved = false;
let squareSaved = false;
let currentAlignment = "center";

// Initialization
$(document).ready(() => {
  // Set default date to first day of current month in 2025
  const today = new Date();
  const defaultDate = new Date(2025, today.getMonth(), 1);
  const formattedDate = defaultDate.toISOString().split('T')[0];
  $("#dateInput").val(formattedDate);
  
  // Load blueprint_social template by default
  $("#exportContainer").load("blueprint_social.html", () => {
    console.log("Blueprint social template loaded");
    updateBlueprint();
  });
});

function updateBlueprint() {
  clearTimeout(previewTimeout);
  previewTimeout = setTimeout(() => {
    const blueprint = blueprints[currentBlueprint];
    const $bp = $("#exportContainer " + blueprint.container);
    if (!$bp.length) {
      console.error("Blueprint container not found:", blueprint.container);
      return;
    }

    const artistVal = $("#artistInput").val();
    const showVal = $("#showInput").val();
    const dateVal = $("#dateInput").val();
    const timeVal = $("#timeInput").val();
    const cityVal = $("#citySelect").val();

    // Update Blueprint
    $bp.find("#bp-image").css("background-image", `url(${uploadedImage})`);
    $bp.find("#city").text(cityVal);
    
    // Format date and update weekday
    if (dateVal) {
      const [year, month, day] = dateVal.split('-');
      const date = new Date(year, month - 1, day);
      const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const weekday = weekdays[date.getDay()];
      
      $bp.find("#bp-date").text(`${day}.${month}.${year}`);
      $bp.find("#bp-weekday").text(weekday);
      console.log("Updated weekday in updateBlueprint:", weekday);
    } else {
      $bp.find("#bp-date").text("");
      $bp.find("#bp-weekday").text("");
    }
    
    $bp.find("#bp-time").text(timeVal);
    $bp.find("#bp-show").text(showVal);
    $bp.find("#bp-artist").text(artistVal);

    // Update image alignment
    const $bpImage = $bp.find("#bp-image");
    $bpImage.css("background-position", getBackgroundPosition(currentAlignment));

    // Generate preview
    html2canvas($bp[0], {
      scale: 1,
      useCORS: true,
      logging: false,
      backgroundColor: "#222",
      imageTimeout: 0,
      allowTaint: true,
      quality: 1.0
    }).then(canvas => {
      const preview = $("#webpPreview");
      preview.attr("src", canvas.toDataURL("image/webp", 1.0));
      preview.css("display", "block");
      console.log("Preview updated successfully");
    }).catch(error => {
      console.error("Error generating preview:", error);
    });
  }, 300);
}

// Add function to check if any input has changed
function resetSaveStates() {
    socialSaved = false;
    squareSaved = false;
    $("#createFrame").removeClass('saved').html('save social (3×4)');
    $("#createSquareFrame").removeClass('saved').html('save square');
}

// Modify the input change handlers to reset save states and update preview
$("#artistInput, #showInput, #dateInput, #timeInput, #citySelect").on("input change", function() {
    resetSaveStates();
    
    // Make sure the correct blueprint is loaded before updating
    if ($("#exportContainer " + blueprints[currentBlueprint].container).length === 0) {
        $("#exportContainer").load(blueprints[currentBlueprint].template, () => {
            console.log(`Loaded template: ${blueprints[currentBlueprint].template}`);
            updateBlueprint();
        });
    } else {
        updateBlueprint();
    }
});

// Add handler for image changes
$("#imageInput").on("change", function(e) {
    resetSaveStates();
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedImage = e.target.result;
            // Make sure the correct blueprint is loaded before updating
            if ($("#exportContainer " + blueprints[currentBlueprint].container).length === 0) {
                $("#exportContainer").load(blueprints[currentBlueprint].template, () => {
                    console.log(`Loaded template: ${blueprints[currentBlueprint].template}`);
                    updateBlueprint();
                });
            } else {
                updateBlueprint();
            }
        };
        reader.readAsDataURL(file);
    }
});

// Modify the createFrame click handler
$("#createFrame").on("click", function() {
    // Check all required fields
    const artistVal = $("#artistInput").val().trim();
    const showVal = $("#showInput").val().trim();
    const dateVal = $("#dateInput").val().trim();
    const timeVal = $("#timeInput").val().trim();
    const cityVal = $("#citySelect").val();

    // Check if required fields are empty
    if (!uploadedImage) {
        alert("Please select an image first");
        return;
    }
    if (!showVal) {
        alert("Please enter a show name");
        return;
    }
    if (!dateVal) {
        alert("Please select a date");
        return;
    }
    if (!timeVal) {
        alert("Please select a time");
        return;
    }
    if (!cityVal) {
        alert("Please select a city");
        return;
    }

    // Format date as yyyy_mm_dd
    const [year, month, day] = dateVal.split('-');
    const formattedDate = `${year}_${month}_${day}`;
    
    // Construct filename
    const fileName = `${formattedDate}_${showVal}${artistVal ? '_' + artistVal : ''}.webp`;

    // Always use the original blueprint for social format, regardless of preview
    $("#exportContainer").load(blueprints.original.template, () => {
        const $bp = $("#exportContainer #blueprint");
        updateBlueprintContent($bp); // Update content before export
        
        html2canvas($bp[0], {
            scale: 2,
            useCORS: true,
            logging: true
        }).then(canvas => {
            const link = document.createElement("a");
            link.download = fileName;
            link.href = canvas.toDataURL("image/webp");
            link.click();
            
            // Add saved state
            socialSaved = true;
            $(this).html('save social (3×4) <span class="checkmark">✓</span>');
            $(this).addClass('saved');
        });
    });
});

// Modify the createSquareFrame click handler
$("#createSquareFrame").on("click", function() {
    // Check all required fields
    const artistVal = $("#artistInput").val().trim();
    const showVal = $("#showInput").val().trim();
    const dateVal = $("#dateInput").val().trim();
    
    // Check if required fields are empty
    if (!uploadedImage) {
        alert("Please select an image first");
        return;
    }
    if (!showVal) {
        alert("Please enter a show name");
        return;
    }
    if (!dateVal) {
        alert("Please select a date");
        return;
    }

    // Format date as yyyy_mm_dd
    const [year, month, day] = dateVal.split('-');
    const formattedDate = `${year}_${month}_${day}`;
    
    // Construct filename
    const fileName = `${formattedDate}_${showVal}${artistVal ? '_' + artistVal : ''}_square.webp`;

    // Always use the square blueprint, regardless of preview
    $("#exportContainer").load(blueprints.square.template, () => {
        const $bp = $("#exportContainer #blueprint_square");
        updateBlueprintContent($bp); // Update content before export
        
        html2canvas($bp[0], {
            scale: 2,
            useCORS: true,
            logging: true
        }).then(canvas => {
            const link = document.createElement("a");
            link.download = fileName;
            link.href = canvas.toDataURL("image/webp");
            link.click();
            
            // Add saved state
            squareSaved = true;
            $(this).html('save square <span class="checkmark">✓</span>');
            $(this).addClass('saved');
        });
    });
});

// Add toggle functionality
$(".toggle-option").on("click", function() {
    const blueprint = $(this).data("blueprint");
    $(".toggle-option").removeClass("active");
    $(this).addClass("active");
    currentBlueprint = blueprint;
    
    // Update preview aspect ratio
    const ratio = blueprint === "square" ? "1 / 1" : "3 / 4";
    $("#previewArea").css("--preview-ratio", ratio);
    
    // Load new blueprint template
    $("#exportContainer").load(blueprints[blueprint].template, () => {
        console.log(`Loaded template: ${blueprints[blueprint].template}`);
        updateBlueprint();
        resetSaveStates(); // Reset save states when switching formats
    });
});

// Drag & Drop Handling
const imageUpload = document.querySelector('.image-upload');

imageUpload.addEventListener('dragenter', preventDefaults);
imageUpload.addEventListener('dragover', preventDefaults);
imageUpload.addEventListener('dragleave', handleDragLeave);
imageUpload.addEventListener('drop', handleDrop);

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
    imageUpload.style.borderColor = '#F794B3'; // Highlight drop zone
    imageUpload.style.color = '#F794B3';
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    imageUpload.style.borderColor = '#ccc'; // Reset border color
    imageUpload.style.color = '#888';
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    imageUpload.style.borderColor = '#ccc'; // Reset border color
    imageUpload.style.color = '#888';

    const dt = e.dataTransfer;
    const files = dt.files;

    if (files.length) {
        const file = files[0];
        // Check if file is an image
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                uploadedImage = e.target.result;
                updateBlueprint();
                
                // Update the file input
                const fileInput = document.getElementById('imageInput');
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                fileInput.files = dataTransfer.files;
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please upload an image file');
        }
    }
}

// Add helper function to update blueprint content
function updateBlueprintContent($bp) {
    const artistVal = $("#artistInput").val();
    const showVal = $("#showInput").val();
    const dateVal = $("#dateInput").val();
    const timeVal = $("#timeInput").val();
    const cityVal = $("#citySelect").val();

    $bp.find("#bp-image").css({
        "background-image": `url(${uploadedImage})`,
        "background-position": getBackgroundPosition(currentAlignment)
    });
    $bp.find("#city").text(cityVal);
    
    // Format date as DD.MM.YYYY and get weekday
    if (dateVal) {
        const [year, month, day] = dateVal.split('-');
        const date = new Date(year, month - 1, day); // month is 0-indexed in JavaScript
        
        // Get weekday abbreviation (MON, TUE, WED, etc.)
        const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const weekday = weekdays[date.getDay()];
        
        // Format the date
        const formattedDate = `${day}.${month}.${year}`;
        
        // Update the HTML - use explicit selectors
        $bp.find("#bp-date").text(formattedDate);
        $bp.find("#bp-weekday").text(weekday);
        
        // Log for debugging
        console.log("Updated weekday to:", weekday);
        console.log("Weekday element found:", $bp.find("#bp-weekday").length > 0);
    } else {
        $bp.find("#bp-date").text("");
        $bp.find("#bp-weekday").text("");
    }
    
    $bp.find("#bp-time").text(timeVal);
    $bp.find("#bp-show").text(showVal);
    $bp.find("#bp-artist").text(artistVal);
}

// Add this to your existing code
$(".align-btn").on("click", function() {
    const alignment = $(this).data("align");
    $(".align-btn").removeClass("active");
    $(this).addClass("active");
    currentAlignment = alignment;
    updateBlueprint();
});

// Add this helper function
function getBackgroundPosition(alignment) {
    switch(alignment) {
        case "top": return "center top";
        case "bottom": return "center bottom";
        case "left": return "left center";
        case "right": return "right center";
        default: return "center center";
    }
}

// Add specific handler for date changes
$("#dateInput").on("change", function() {
    // Force reload of the template to ensure all elements are present
    $("#exportContainer").load(blueprints[currentBlueprint].template, () => {
        console.log("Template reloaded after date change");
        updateBlueprint();
    });
});