/**
 * custom-font-manager.js - Custom font upload and management
 * A standalone module that handles font uploads and integration with your game
 */

const CustomFontManager = (function() {
    // Private variables
    const STORAGE_KEY = 'sudoku_td_custom_fonts';
    const DEFAULT_FONT_CLASS = 'font-default';
    const customFonts = {};
    let isInitialized = false;
    
    /**
     * Initialize the custom font manager
     */
    function init() {
        if (isInitialized) return;
        
        console.log("CustomFontManager: Initializing...");
        
        // Load saved fonts
        loadSavedFonts();
        
        // Create UI elements if they don't exist
        createUI();
        
        // Set up event listeners
        setupEventListeners();
        
        isInitialized = true;
    }
    
    /**
     * Load saved fonts from localStorage
     */
    function loadSavedFonts() {
        try {
            const savedFonts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            
            // Load each saved font
            Object.keys(savedFonts).forEach(fontName => {
                const fontData = savedFonts[fontName];
                const fontDisplayName = savedFonts[`${fontName}_display`] || fontName;
                loadFont(fontName, fontData, fontDisplayName);
            });
            
            console.log(`CustomFontManager: Loaded ${Object.keys(savedFonts).length / 2} custom fonts`);
        } catch (err) {
            console.error('CustomFontManager: Error loading custom fonts:', err);
            // Reset storage if corrupted
            localStorage.removeItem(STORAGE_KEY);
        }
    }
    
    /**
     * Create UI elements for font upload
     */
    function createUI() {
        // Check if UI already exists
        if (document.getElementById('custom-font-section')) return;
        
        // Find where to insert the UI (after font-selector)
        const fontSelector = document.getElementById('font-selector');
        if (!fontSelector) {
            console.warn("CustomFontManager: Font selector not found, cannot create UI");
            return;
        }
        
        // Create the UI container
        const fontSection = document.createElement('div');
        fontSection.id = 'custom-font-section';
        fontSection.innerHTML = `
            <button id="toggle-font-upload" class="small-button">Add Custom Font</button>
            <div id="font-upload-panel" style="display: none;">
                <input type="file" id="font-file" accept=".ttf,.otf,.woff,.woff2" />
                <input type="text" id="font-name" placeholder="Font name" maxlength="20" />
                <button id="upload-font" class="small-button">Upload</button>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #custom-font-section {
                margin-top: 10px;
                text-align: center;
            }
            
            .small-button {
                padding: 5px 10px;
                background-color: var(--primary-color, #4CAF50);
                color: white;
                border: none;
                border-radius: 4px;
                font-size: 0.8rem;
                cursor: pointer;
                margin: 0 5px;
            }
            
            .small-button:hover {
                background-color: var(--primary-dark, #3e8e41);
            }
            
            #font-upload-panel {
                margin-top: 10px;
                padding: 10px;
                background-color: #f9f9f9;
                border-radius: 4px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            
            #font-name {
                padding: 5px;
                margin: 0 5px;
                border: 1px solid #ccc;
                border-radius: 4px;
            }
            
            .font-sample {
                margin-top: 5px;
                font-size: 1.2em;
            }
        `;
        
        // Insert after font selector
        fontSelector.parentNode.insertBefore(fontSection, fontSelector.nextSibling);
        document.head.appendChild(style);
    }
    
    /**
     * Set up event listeners for the font uploader
     */
    function setupEventListeners() {
        // Toggle font upload panel
        const toggleButton = document.getElementById('toggle-font-upload');
        if (toggleButton) {
            toggleButton.addEventListener('click', function() {
                const panel = document.getElementById('font-upload-panel');
                if (panel) {
                    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
                }
            });
        }
        
        // Handle font upload
        const uploadButton = document.getElementById('upload-font');
        if (uploadButton) {
            uploadButton.addEventListener('click', handleFontUpload);
        }
        
        // Preview font when file is selected
        const fileInput = document.getElementById('font-file');
        if (fileInput) {
            fileInput.addEventListener('change', function() {
                if (this.files.length) {
                    // Remove any existing preview
                    const existingPreview = document.getElementById('font-preview');
                    if (existingPreview) existingPreview.remove();
                }
            });
        }
    }
    
    /**
     * Handle font file upload
     */
    function handleFontUpload() {
        const fileInput = document.getElementById('font-file');
        const nameInput = document.getElementById('font-name');
        
        if (!fileInput.files.length) {
            showNotification('Please select a font file');
            return;
        }
        
        if (!nameInput.value.trim()) {
            showNotification('Please enter a name for your font');
            return;
        }
        
        // File size check (5MB max)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (fileInput.files[0].size > maxSize) {
            showNotification('Font file is too large (max 5MB)');
            return;
        }
        
        const displayName = nameInput.value.trim();
        const fontName = displayName.replace(/[^a-z0-9-_]/gi, '-').toLowerCase();
        const fontFile = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const fontData = e.target.result;
            
            // Save and load the font
            saveFont(fontName, fontData, displayName);
            loadFont(fontName, fontData, displayName);
            
            // Add to dropdown
            addFontOption(fontName, displayName);
            
            // Clear form
            fileInput.value = '';
            nameInput.value = '';
            
            // Close panel
            const panel = document.getElementById('font-upload-panel');
            if (panel) panel.style.display = 'none';
            
            // Show message
            showNotification(`Custom font "${displayName}" added`);
            
            // Publish event if EventSystem exists
            if (window.EventSystem && typeof EventSystem.publish === 'function') {
                EventSystem.publish('custom-font-added', { 
                    name: fontName, 
                    displayName: displayName 
                });
            }
        };
        
        reader.readAsDataURL(fontFile);
    }
    
    /**
     * Save font to localStorage
     */
    function saveFont(fontName, fontData, displayName) {
        try {
            // Save to memory
            customFonts[fontName] = fontData;
            
            // Save to localStorage
            const savedFonts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            savedFonts[fontName] = fontData;
            savedFonts[`${fontName}_display`] = displayName;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(savedFonts));
            
            console.log(`CustomFontManager: Font "${fontName}" saved`);
        } catch (err) {
            console.error('CustomFontManager: Error saving font:', err);
            showNotification('Could not save font. The file might be too large.');
        }
    }
    
    /**
     * Load a font and make it available in the game
     */
    function loadFont(fontName, fontData, displayName) {
        // Create @font-face rule
        const styleId = `font-style-${fontName}`;
        
        // Remove existing style if it exists
        const existingStyle = document.getElementById(styleId);
        if (existingStyle) existingStyle.remove();
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            @font-face {
                font-family: 'custom-${fontName}';
                src: url('${fontData}') format('woff2');
                font-weight: normal;
                font-style: normal;
            }
            
            .font-custom-${fontName} {
                font-family: 'custom-${fontName}', sans-serif;
            }
        `;
        document.head.appendChild(style);
        
        console.log(`CustomFontManager: Font "${fontName}" loaded`);
        
        // Add to dropdown if it doesn't exist yet
        if (displayName) {
            addFontOption(fontName, displayName);
        }
    }
    
    /**
     * Add font option to the selector dropdown
     */
    function addFontOption(fontName, displayName) {
        const selector = document.getElementById('font-selector');
        if (!selector) return;
        
        // Check if option already exists
        const existingOption = document.querySelector(`option[value="font-custom-${fontName}"]`);
        if (existingOption) {
            existingOption.textContent = `${displayName} (Custom)`;
            return;
        }
        
        // Add new option
        const option = document.createElement('option');
        option.value = `font-custom-${fontName}`;
        option.textContent = `${displayName} (Custom)`;
        option.className = `font-custom-${fontName}`;
        selector.appendChild(option);
    }
    
    /**
     * Show a notification message
     */
    function showNotification(message) {
        // Use game's notification system if available
        if (window.EventSystem && typeof EventSystem.publish === 'function') {
            EventSystem.publish('GameEvents.STATUS_MESSAGE', message);
        } else {
            // Create a simple notification
            let notification = document.getElementById('custom-font-notification');
            
            if (!notification) {
                notification = document.createElement('div');
                notification.id = 'custom-font-notification';
                notification.style.position = 'fixed';
                notification.style.bottom = '20px';
                notification.style.right = '20px';
                notification.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                notification.style.color = 'white';
                notification.style.padding = '10px 15px';
                notification.style.borderRadius = '5px';
                notification.style.zIndex = '1000';
                document.body.appendChild(notification);
            }
            
            notification.textContent = message;
            notification.style.display = 'block';
            
            // Hide after 3 seconds
            setTimeout(() => {
                notification.style.display = 'none';
            }, 3000);
        }
    }
    
    /**
     * Delete a custom font
     */
    function deleteFont(fontName) {
        // Remove from memory
        delete customFonts[fontName];
        
        // Remove from localStorage
        try {
            const savedFonts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            delete savedFonts[fontName];
            delete savedFonts[`${fontName}_display`];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(savedFonts));
            
            // Remove from dropdown
            const selector = document.getElementById('font-selector');
            if (selector) {
                const option = selector.querySelector(`option[value="font-custom-${fontName}"]`);
                if (option) option.remove();
            }
            
            // Remove style element
            const style = document.getElementById(`font-style-${fontName}`);
            if (style) style.remove();
            
            console.log(`CustomFontManager: Font "${fontName}" deleted`);
            showNotification(`Custom font deleted`);
        } catch (err) {
            console.error('CustomFontManager: Error deleting font:', err);
        }
    }
    
    /**
     * Apply a font to the game
     */
    function applyFont(fontClass) {
        // Remove existing font classes
        document.body.classList.forEach(cls => {
            if (cls.startsWith('font-')) {
                document.body.classList.remove(cls);
            }
        });
        
        // Add new font class
        document.body.classList.add(fontClass);
        
        // Save preference
        localStorage.setItem('sudoku_td_font', fontClass);
    }
    
    /**
     * Get list of all available fonts
     */
    function getAllFonts() {
        const builtInFonts = [
            { name: 'default', displayName: 'Default Font' },
            { name: 'retro', displayName: 'Retro Font' },
            { name: 'elegant', displayName: 'Elegant Font' },
            { name: 'playful', displayName: 'Playful Font' },
            { name: 'modern', displayName: 'Modern Font' }
        ];
        
        const customFontsList = [];
        
        try {
            const savedFonts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            
            Object.keys(savedFonts).forEach(key => {
                if (!key.endsWith('_display')) {
                    customFontsList.push({
                        name: `custom-${key}`,
                        displayName: savedFonts[`${key}_display`] || key,
                        isCustom: true
                    });
                }
            });
        } catch (err) {
            console.error('CustomFontManager: Error listing fonts:', err);
        }
        
        return [...builtInFonts, ...customFontsList];
    }
    
    // Initialize on page load
    document.addEventListener('DOMContentLoaded', init);
    
    // Public API
    return {
        init,
        loadFont,
        deleteFont,
        applyFont,
        getAllFonts
    };
})();

// Make module available globally
window.CustomFontManager = CustomFontManager;