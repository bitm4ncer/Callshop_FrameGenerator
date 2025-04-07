/**
 * CALLSHOP.RADIO Frame Generator
 * A tool to create social media graphics for radio shows
 * Version 1.0
 */

// Global variables
let uploadedImage = "";
let previewTimeout;
let currentBlueprint = "original";
let currentAlignment = "center";
let currentExportMode = "current";
let currentOverlay = "none"; // Changed from "gray" to "none" as default overlay style

// Blueprint configurations
const blueprints = {
  original: {
    template: "blueprint_social.html",
    container: "#blueprint",
    dimensions: { width: 1080, height: 1350 }
  },
  square: {
    template: "blueprint_square.html",
    container: "#blueprint_square",
    dimensions: { width: 1080, height: 1080 }
  }
};

// Cache for loaded templates
const templateCache = {};

/**
 * Initialize the application
 */
$(document).ready(() => {
  // Set current date and time
  setCurrentDateTime();
  
  // Load initial template
  loadTemplate(currentBlueprint).then(() => {
    console.log("Initial template loaded");
    updateBlueprint();
  });
  
  // Initialize button states
  resetSaveStates();
  
  // Initialize overlay toggle - set "none" as active
  $(".overlay-toggle .toggle-option").removeClass("active");
  $(".overlay-toggle .toggle-option[data-overlay='none']").addClass("active");
  
  // Set up event listeners
  setupEventListeners();
  setupDragAndDrop();
});

/**
 * Set up event listeners for form elements and buttons
 */
function setupEventListeners() {
  // Form input change handlers
  $("#artistInput, #showInput, #dateInput, #timeInput, #citySelect").on("input change", function() {
    resetSaveStates();
    updateBlueprintDebounced();
  });
  
  // Custom city input handler - automatically handle city selection
  $("#customCityInput").on("input", function() {
    const customCityValue = $(this).val().trim();
    
    // If there's text in the custom city field, disable the dropdown
    if (customCityValue !== "") {
      $("#citySelect").prop("disabled", true).css("opacity", "0.5");
    } else {
      // If the custom city field is empty, enable the dropdown
      $("#citySelect").prop("disabled", false).css("opacity", "1");
    }
    
    resetSaveStates();
    updateBlueprintDebounced();
  });
  
  // Image input change handler
  $("#imageInput").on("change", handleImageUpload);
  
  // Export mode toggle
  $(".export-mode-container .toggle-option").on("click", function() {
    const exportMode = $(this).data("export-mode");
    $(".export-mode-container .toggle-option").removeClass("active");
    $(this).addClass("active");
    currentExportMode = exportMode;
    resetSaveStates();
  });
  
  // Blueprint format toggle
  $(".blueprint-toggle .toggle-option").on("click", function() {
    const blueprint = $(this).data("blueprint");
    $(".blueprint-toggle .toggle-option").removeClass("active");
    $(this).addClass("active");
    currentBlueprint = blueprint;
    
    // Update preview aspect ratio
    const ratio = blueprint === "square" ? "1 / 1" : "3 / 4";
    $("#previewArea").css("--preview-ratio", ratio);
    
    // Load and update template
    loadTemplate(blueprint).then(() => {
      updateBlueprint();
      resetSaveStates();
    });
  });
  
  // Overlay style toggle
  $(".overlay-toggle .toggle-option").on("click", function() {
    const overlay = $(this).data("overlay");
    $(".overlay-toggle .toggle-option").removeClass("active");
    $(this).addClass("active");
    currentOverlay = overlay;
    updateBlueprint();
    resetSaveStates();
  });
  
  // Image alignment controls
  $(".align-btn").on("click", function() {
    const alignment = $(this).data("align");
    $(".align-btn").removeClass("active");
    $(this).addClass("active");
    currentAlignment = alignment;
    updateBlueprint();
  });

  // Export button handler
  $("#saveButton").on("click", handleExport);
  
  // Date change handler (ensure template is reloaded for weekday)
  $("#dateInput").on("change", function() {
    loadTemplate(currentBlueprint).then(() => {
      console.log("Template reloaded after date change");
      updateBlueprint();
    });
  });
}

/**
 * Set current date and time in form inputs
 */
function setCurrentDateTime() {
  const now = new Date();
  
  // Format date as YYYY-MM-DD
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;
  
  // Format time as HH:MM
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const formattedTime = `${hours}:${minutes}`;
  
  // Set values
  $("#dateInput").val(formattedDate);
  $("#timeInput").val(formattedTime);
}

/**
 * Load a blueprint template with caching
 * @param {string} blueprintType - The type of blueprint to load
 * @returns {Promise} - A promise resolving when the template is loaded
 */
function loadTemplate(blueprintType) {
  return new Promise((resolve, reject) => {
    const template = blueprints[blueprintType].template;
    
    // Use cached template if available
    if (templateCache[template]) {
      $("#exportContainer").html(templateCache[template]);
      resolve();
      return;
    }
    
    // Load template from file
    $("#exportContainer").load(template, (response, status, xhr) => {
      if (status === "error") {
        console.error(`Error loading template: ${xhr.status} ${xhr.statusText}`);
        reject(new Error(`Failed to load template: ${status}`));
        return;
      }
      
      // Cache the template
      templateCache[template] = response;
      resolve();
    });
  });
}

/**
 * Handle image file upload
 * @param {Event} e - The change event
 */
function handleImageUpload(e) {
    resetSaveStates();
    const file = e.target.files[0];
  
  if (!file) return;
  
  // Validate file is an image
  if (!file.type.startsWith('image/')) {
    alert('Please upload an image file');
    return;
  }
  
        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedImage = e.target.result;
    
    // Ensure template is loaded before updating
    if ($("#exportContainer " + blueprints[currentBlueprint].container).length === 0) {
      loadTemplate(currentBlueprint).then(() => {
        updateBlueprint();
      });
    } else {
            updateBlueprint();
    }
        };
        reader.readAsDataURL(file);
    }

/**
 * Debounced version of updateBlueprint to prevent too many updates
 */
function updateBlueprintDebounced() {
  // Make sure the correct blueprint is loaded before updating
  if ($("#exportContainer " + blueprints[currentBlueprint].container).length === 0) {
    loadTemplate(currentBlueprint).then(() => {
      updateBlueprint();
    });
  } else {
    updateBlueprint();
  }
}

/**
 * Update the blueprint with current form values and generate preview
 */
function updateBlueprint() {
  clearTimeout(previewTimeout);
  previewTimeout = setTimeout(() => {
    const blueprint = blueprints[currentBlueprint];
    const $bp = $("#exportContainer " + blueprint.container);
    
    if (!$bp.length) {
      console.error("Blueprint container not found:", blueprint.container);
      return;
    }

    // Get form values
    const values = getFormValues();

    // Update blueprint content
    updateBlueprintElements($bp, values);

    // Generate preview
    generatePreview($bp[0]);
  }, 300);
}

/**
 * Get all form input values
 * @returns {Object} - Object containing form values
 */
function getFormValues() {
  let cityValue;
  
  // Use custom city if it's not empty, otherwise use the dropdown
  const customCityValue = $("#customCityInput").val().trim();
  if (customCityValue !== "") {
    cityValue = customCityValue;
  } else {
    cityValue = $("#citySelect").val();
  }
  
  return {
    artist: $("#artistInput").val(),
    show: $("#showInput").val(),
    date: $("#dateInput").val(),
    time: $("#timeInput").val(),
    city: cityValue
  };
}

/**
 * Update blueprint elements with form values
 * @param {jQuery} $bp - jQuery object for the blueprint container
 * @param {Object} values - Object containing form values
 */
function updateBlueprintElements($bp, values) {
  // Update image and alignment
  $bp.find("#bp-image").css({
    "background-image": `url(${uploadedImage})`,
    "background-position": getBackgroundPosition(currentAlignment)
  });
  
  // Update overlays based on selected style
  $bp.find(".overlay").each(function() {
    // Remove existing overlay classes
    $(this).removeClass("overlay-gray overlay-black overlay-none");
    
    // Add the selected overlay class
    $(this).addClass(`overlay-${currentOverlay}`);
  });
  
  // Update city
  $bp.find("#city").text(values.city);
    
    // Format date and update weekday
  if (values.date) {
    const [year, month, day] = values.date.split('-');
      const date = new Date(year, month - 1, day);
      const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const weekday = weekdays[date.getDay()];
      
      $bp.find("#bp-date").text(`${day}.${month}.${year}`);
      $bp.find("#bp-weekday").text(weekday);
    } else {
      $bp.find("#bp-date").text("");
      $bp.find("#bp-weekday").text("");
    }
    
  // Update time, show and artist
  $bp.find("#bp-time").text(values.time);
  $bp.find("#bp-show").text(values.show);
  $bp.find("#bp-artist").text(values.artist);
}

/**
 * Generate preview image
 * @param {HTMLElement} element - The blueprint element to render
 */
function generatePreview(element) {
  html2canvas(element, {
      scale: 1,
      useCORS: true,
      logging: false,
      backgroundColor: "#222",
      imageTimeout: 0,
      allowTaint: true,
      quality: 1.0
    }).then(canvas => {
      const preview = $("#webpPreview");
      preview.attr("src", canvas.toDataURL("image/jpeg", 0.75));
      preview.css("display", "block");
    }).catch(error => {
      console.error("Error generating preview:", error);
    });
}

/**
 * Handle export button click
 */
function handleExport() {
  // Validate form inputs
  if (!validateExportInputs()) return;

  // Get form values
  const values = getFormValues();
  
  // Format date for filename
  const [year, month, day] = values.date.split('-');
  const formattedDate = `${year}_${month}_${day}`;
  
  // Export based on mode
  if (currentExportMode === "current") {
    exportSingleBlueprint(currentBlueprint, formattedDate, values);
            } else {
    exportAllBlueprints(formattedDate, values);
  }
}

/**
 * Validate required inputs before export
 * @returns {boolean} - True if valid, false otherwise
 */
function validateExportInputs() {
  const values = getFormValues();
  
  // Check required fields
  if (!uploadedImage) {
    alert("Please select an image first");
    return false;
  }
  if (!values.show) {
    alert("Please enter a show name");
    return false;
  }
  if (!values.date) {
    alert("Please select a date");
    return false;
  }
  
  // Additional checks for social format
  if (currentExportMode === "current" && currentBlueprint === "original") {
    if (!values.time) {
      alert("Please select a time");
      return false;
    }
    if (!values.city) {
      alert("Please select a city");
      return false;
    }
  }
  
  return true;
}

/**
 * Export a single blueprint
 * @param {string} blueprintType - Type of blueprint to export
 * @param {string} formattedDate - Formatted date for filename
 * @param {Object} values - Form values
 */
function exportSingleBlueprint(blueprintType, formattedDate, values) {
  const isSquare = blueprintType === "square";
  const fileName = `${formattedDate}_${values.show}${values.artist ? '_' + values.artist : ''}${isSquare ? '_square' : ''}.jpg`;
  
  loadTemplate(blueprintType).then(() => {
    const $bp = $("#exportContainer " + blueprints[blueprintType].container);
    const dimensions = blueprints[blueprintType].dimensions;
    
    // Update content and render
    updateBlueprintElements($bp, values);
    renderAndDownload($bp[0], fileName, dimensions);
  });
}

/**
 * Export all blueprint formats
 * @param {string} formattedDate - Formatted date for filename
 * @param {Object} values - Form values
 */
function exportAllBlueprints(formattedDate, values) {
  // First export social format
  loadTemplate("original").then(() => {
    const $bp = $("#exportContainer " + blueprints.original.container);
    const dimensions = blueprints.original.dimensions;
    const fileName = `${formattedDate}_${values.show}${values.artist ? '_' + values.artist : ''}.jpg`;
    
    updateBlueprintElements($bp, values);
    
    // Render and download, then handle square format
    renderAndDownload($bp[0], fileName, dimensions, false).then(() => {
      // Now export square format
      loadTemplate("square").then(() => {
        const $bpSquare = $("#exportContainer " + blueprints.square.container);
        const dimensionsSquare = blueprints.square.dimensions;
        const fileNameSquare = `${formattedDate}_${values.show}${values.artist ? '_' + values.artist : ''}_square.jpg`;
        
        updateBlueprintElements($bpSquare, values);
        renderAndDownload($bpSquare[0], fileNameSquare, dimensionsSquare, true);
            });
        });
    });
}

/**
 * Render and download a blueprint
 * @param {HTMLElement} element - Element to render
 * @param {string} fileName - Download filename
 * @param {Object} dimensions - Width and height dimensions
 * @param {boolean} updateButtonState - Whether to update button state after download
 * @returns {Promise} - Promise resolving when download is complete
 */
function renderAndDownload(element, fileName, dimensions, updateButtonState = true) {
  return new Promise((resolve) => {
    // Set dimensions for rendering
    $(element).css({
      width: dimensions.width + 'px',
      height: dimensions.height + 'px'
    });
    
    html2canvas(element, {
      width: dimensions.width,
      height: dimensions.height,
            scale: 1,
            useCORS: true,
      logging: false,
            backgroundColor: "#222"
        }).then(canvas => {
      // Create final canvas with exact dimensions
            const finalCanvas = document.createElement('canvas');
      finalCanvas.width = dimensions.width;
      finalCanvas.height = dimensions.height;
            const ctx = finalCanvas.getContext('2d');
            
      // Draw rendered content
      ctx.drawImage(canvas, 0, 0, dimensions.width, dimensions.height);
            
      // Download the image
            const link = document.createElement("a");
            link.download = fileName;
            link.href = finalCanvas.toDataURL("image/jpeg", 0.85);
            link.click();
            
      // Reset element dimensions
      $(element).css({
                width: '',
                height: ''
            });
            
      // Update button state if requested
      if (updateButtonState) {
                    $("#saveButton").addClass('saved').html('EXPORTED! <span class="checkmark">✓</span>');
                    
                    setTimeout(() => {
                        $("#saveButton").removeClass('saved').text("EXPORT!");
                    }, 3000);
      }
      
      resolve();
    });
});
}

/**
 * Reset save button states
 */
function resetSaveStates() {
  $("#saveButton").removeClass('saved').text("EXPORT!");
}

/**
 * Get CSS background-position value based on alignment
 * @param {string} alignment - Image alignment (center, top, bottom, left, right)
 * @returns {string} - CSS background-position value
 */
function getBackgroundPosition(alignment) {
    switch(alignment) {
        case "top": return "center top";
        case "bottom": return "center bottom";
        case "left": return "left center";
        case "right": return "right center";
        default: return "center center";
    }
}

/**
 * Set up drag and drop functionality for image upload
 */
function setupDragAndDrop() {
const imageUpload = document.querySelector('.image-upload');

imageUpload.addEventListener('dragenter', preventDefaults);
imageUpload.addEventListener('dragover', preventDefaults);
imageUpload.addEventListener('dragleave', handleDragLeave);
imageUpload.addEventListener('drop', handleDrop);
}

/**
 * Prevent default drag and drop behavior and highlight drop zone
 * @param {Event} e - The drag event
 */
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  const imageUpload = document.querySelector('.image-upload');
  imageUpload.style.borderColor = '#F794B3';
    imageUpload.style.color = '#F794B3';
}

/**
 * Handle drag leave event
 * @param {Event} e - The drag event
 */
function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
  const imageUpload = document.querySelector('.image-upload');
  imageUpload.style.borderColor = '#ccc';
    imageUpload.style.color = '#888';
}

/**
 * Handle file drop event
 * @param {Event} e - The drop event
 */
function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
  const imageUpload = document.querySelector('.image-upload');
  imageUpload.style.borderColor = '#ccc';
    imageUpload.style.color = '#888';

  const files = e.dataTransfer.files;

    if (files.length) {
        const file = files[0];
    
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                uploadedImage = e.target.result;
                updateBlueprint();
                
        // Update file input for form
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