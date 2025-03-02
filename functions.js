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
let currentExportMode = "current";

// Initialization
$(document).ready(() => {
  // Set current date and time
  const now = new Date();
  
  // Format date as YYYY-MM-DD for the date input
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;
  
  // Format time as HH:MM for the time input
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const formattedTime = `${hours}:${minutes}`;
  
  // Set the values
  $("#dateInput").val(formattedDate);
  $("#timeInput").val(formattedTime);
  
  // Load blueprint_social template by default
  $("#exportContainer").load("blueprint_social.html", () => {
    console.log("Blueprint social template loaded");
    updateBlueprint();
  });
  
  // Set initial save button text
  $("#saveButton").text("Save that frame!");
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
    $("#saveButton").removeClass('saved').text("EXPORT!");
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

// Update the export mode toggle functionality
$(".export-mode-container .toggle-option").on("click", function() {
    const exportMode = $(this).data("export-mode");
    $(".export-mode-container .toggle-option").removeClass("active");
    $(this).addClass("active");
    currentExportMode = exportMode;
    resetSaveStates();
});

// Update toggle functionality to also update save button text
$(".blueprint-toggle .toggle-option").on("click", function() {
    const blueprint = $(this).data("blueprint");
    $(".blueprint-toggle .toggle-option").removeClass("active");
    $(this).addClass("active");
    currentBlueprint = blueprint;
    
    // Update preview aspect ratio
    const ratio = blueprint === "square" ? "1 / 1" : "3 / 4";
    $("#previewArea").css("--preview-ratio", ratio);
    
    // Update save button text if in "current" mode
    if (currentExportMode === "current") {
        $("#saveButton").text(`Save ${blueprint === "original" ? "Social (3×4)" : "Square"}`);
    }
    
    // Load new blueprint template
    $("#exportContainer").load(blueprints[blueprint].template, () => {
        console.log(`Loaded template: ${blueprints[blueprint].template}`);
        updateBlueprint();
        resetSaveStates();
    });
});

// Replace the two save button handlers with a single one
$("#saveButton").on("click", function() {
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
    if (!timeVal && currentExportMode === "current" && currentBlueprint === "original") {
        alert("Please select a time");
        return;
    }
    if (!cityVal && currentExportMode === "current" && currentBlueprint === "original") {
        alert("Please select a city");
        return;
    }

    // Format date as yyyy_mm_dd
    const [year, month, day] = dateVal.split('-');
    const formattedDate = `${year}_${month}_${day}`;
    
    // Save based on export mode
    if (currentExportMode === "current") {
        // Save only the current blueprint
        saveSingleBlueprint(currentBlueprint, formattedDate, showVal, artistVal, timeVal, cityVal);
    } else {
        // Save all blueprints
        saveAllBlueprints(formattedDate, showVal, artistVal, timeVal, cityVal);
    }
});

// Helper function to save a single blueprint with specific dimensions
function saveSingleBlueprint(blueprintType, formattedDate, showVal, artistVal, timeVal, cityVal) {
    const isSquare = blueprintType === "square";
    const fileName = `${formattedDate}_${showVal}${artistVal ? '_' + artistVal : ''}${isSquare ? '_square' : ''}.webp`;
    
    $("#exportContainer").load(blueprints[blueprintType].template, () => {
        const $bp = $("#exportContainer " + blueprints[blueprintType].container);
        updateBlueprintContent($bp);
        
        // Set dimensions based on blueprint type
        const width = 1080;
        const height = isSquare ? 1080 : 1350;
        
        // Set container dimensions for proper rendering
        $bp.css({
            width: width + 'px',
            height: height + 'px'
        });
        
        html2canvas($bp[0], {
            width: width,
            height: height,
            scale: 1, // Use scale 1 since we're setting exact dimensions
            useCORS: true,
            logging: true,
            backgroundColor: "#222"
        }).then(canvas => {
            // Create a new canvas with the exact dimensions we want
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = width;
            finalCanvas.height = height;
            const ctx = finalCanvas.getContext('2d');
            
            // Draw the rendered content to our final canvas
            ctx.drawImage(canvas, 0, 0, width, height);
            
            const link = document.createElement("a");
            link.download = fileName;
            link.href = finalCanvas.toDataURL("image/webp", 1.0);
            link.click();
            
            // Add saved state
            $("#saveButton").addClass('saved').html('Frame saved! <span class="checkmark">✓</span>');
            
            setTimeout(() => {
                $("#saveButton").removeClass('saved').text("Save that frame!");
            }, 3000);
            
            // Reset container dimensions
            $bp.css({
                width: '',
                height: ''
            });
        });
    });
}

// Helper function to save all blueprints with specific dimensions
function saveAllBlueprints(formattedDate, showVal, artistVal, timeVal, cityVal) {
    // First save the social blueprint (1080x1350)
    $("#exportContainer").load(blueprints.original.template, () => {
        const $bp = $("#exportContainer " + blueprints.original.container);
        updateBlueprintContent($bp);
        
        // Set dimensions for social format
        const socialWidth = 1080;
        const socialHeight = 1350;
        
        // Set container dimensions for proper rendering
        $bp.css({
            width: socialWidth + 'px',
            height: socialHeight + 'px'
        });
        
        html2canvas($bp[0], {
            width: socialWidth,
            height: socialHeight,
            scale: 1,
            useCORS: true,
            logging: true,
            backgroundColor: "#222"
        }).then(canvas => {
            // Create a new canvas with the exact dimensions we want
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = socialWidth;
            finalCanvas.height = socialHeight;
            const ctx = finalCanvas.getContext('2d');
            
            // Draw the rendered content to our final canvas
            ctx.drawImage(canvas, 0, 0, socialWidth, socialHeight);
            
            const link = document.createElement("a");
            link.download = `${formattedDate}_${showVal}${artistVal ? '_' + artistVal : ''}.webp`;
            link.href = finalCanvas.toDataURL("image/webp", 1.0);
            link.click();
            
            // Reset container dimensions
            $bp.css({
                width: '',
                height: ''
            });
            
            // Now save the square blueprint (1080x1080)
            $("#exportContainer").load(blueprints.square.template, () => {
                const $bpSquare = $("#exportContainer " + blueprints.square.container);
                updateBlueprintContent($bpSquare);
                
                // Set dimensions for square format
                const squareWidth = 1080;
                const squareHeight = 1080;
                
                // Set container dimensions for proper rendering
                $bpSquare.css({
                    width: squareWidth + 'px',
                    height: squareHeight + 'px'
                });
                
                html2canvas($bpSquare[0], {
                    width: squareWidth,
                    height: squareHeight,
                    scale: 1,
                    useCORS: true,
                    logging: true,
                    backgroundColor: "#222"
                }).then(canvas => {
                    // Create a new canvas with the exact dimensions we want
                    const finalCanvas = document.createElement('canvas');
                    finalCanvas.width = squareWidth;
                    finalCanvas.height = squareHeight;
                    const ctx = finalCanvas.getContext('2d');
                    
                    // Draw the rendered content to our final canvas
                    ctx.drawImage(canvas, 0, 0, squareWidth, squareHeight);
                    
                    const link = document.createElement("a");
                    link.download = `${formattedDate}_${showVal}${artistVal ? '_' + artistVal : ''}_square.webp`;
                    link.href = finalCanvas.toDataURL("image/webp", 1.0);
                    link.click();
                    
                    // Add saved state
                    $("#saveButton").addClass('saved').html('Frames saved! <span class="checkmark">✓</span>');
                    
                    setTimeout(() => {
                        $("#saveButton").removeClass('saved').text("Save that frame!");
                    }, 3000);
                    
                    // Reset container dimensions
                    $bpSquare.css({
                        width: '',
                        height: ''
                    });
                });
            });
        });
    });
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