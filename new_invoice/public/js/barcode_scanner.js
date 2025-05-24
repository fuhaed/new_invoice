// BarcodeScannerHelper class for Modern Invoice
class BarcodeScannerHelper {
    constructor(opts) {
      // Default options
      this.options = {
        wrapper: null,
        callback: null
      };
      
      // Extend options with provided values
      if (opts) {
        $.extend(this.options, opts);
      }
      
      // Initialize elements and properties
      this.init();
    }
  
    init() {
      // Get wrapper from options
      this.wrapper = this.options.wrapper;
      
      if (!this.wrapper) {
        console.error('Wrapper not provided for BarcodeScannerHelper');
        return;
      }
      
      // Find elements in the DOM
      this.video = this.wrapper.find('#barcode_video')[0];
      this.canvas = this.wrapper.find('#barcode_canvas')[0];
      this.camera_container = this.wrapper.find('#barcode_camera_container');
      this.modal_video = this.wrapper.find('#modal_barcode_video')[0];
      this.modal_canvas = this.wrapper.find('#modal_barcode_canvas')[0];
      this.modal = this.wrapper.find('#barcode_modal');
      
      // Initialize state variables
      this.camera_active = false;
      this.modal_active = false;
      this.detection_loop = null;
      this.modal_detection_loop = null;
      this.quagga_available = false;
      
      // Check for browser compatibility
      this.check_compatibility();
      
      // Initialize the barcode detector
      this.initialize_detector();
    }
  
    check_compatibility() {
      // Check for camera access
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('Camera access is not supported in this browser');
        return false;
      }
      
      return true;
    }
  
    initialize_detector() {
      // Check if BarcodeDetector API is available
      if ('BarcodeDetector' in window) {
        try {
          this.detector = new BarcodeDetector({
            formats: [
              'qr_code',
              'code_39',
              'code_128',
              'ean_13',
              'ean_8',
              'upc_a',
              'upc_e',
              'itf'
            ]
          });
          console.log('BarcodeDetector API initialized');
        } catch (e) {
          console.warn('Error initializing BarcodeDetector:', e);
          this.load_quagga();
        }
      } else {
        console.warn('BarcodeDetector API is not available in this browser');
        this.load_quagga();
      }
    }
  
    load_quagga() {
      // Load QuaggaJS as a fallback for browsers without BarcodeDetector API
      if (typeof Quagga === 'undefined') {
        console.log('Loading QuaggaJS...');
        
        $.getScript('https://cdn.jsdelivr.net/npm/@ericblade/quagga2@1.8.2/dist/quagga.min.js')
          .done(() => {
            console.log('QuaggaJS loaded successfully');
            this.quagga_available = true;
          })
          .fail((jqxhr, settings, exception) => {
            console.error('Failed to load QuaggaJS:', exception);
            this.quagga_available = false;
          });
      } else {
        console.log('QuaggaJS already loaded');
        this.quagga_available = true;
      }
    }
  
    toggle_camera() {
      if (this.camera_active) {
        this.stop_camera();
      } else {
        this.start_camera();
      }
    }
  
    toggle_modal() {
      if (this.modal_active) {
        this.modal.modal('hide');
        this.stop_modal_camera();
      } else {
        this.modal.modal('show');
        this.start_modal_camera();
      }
    }
  
    start_camera() {
      // Check compatibility first
      if (!this.check_compatibility()) {
        frappe.show_alert({
          message: __('Camera access is not supported in this browser'),
          indicator: 'red'
        });
        return;
      }
      
      // Use modal if native barcode detection is not available
      if (!this.detector && !this.quagga_available) {
        this.toggle_modal();
        return;
      }
      
      navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      .then(stream => {
        if (!this.video) {
          console.error('Video element not found');
          return;
        }
        
        this.video.srcObject = stream;
        this.video.setAttribute('playsinline', true);
        this.video.play();
        
        if (this.camera_container) {
          this.camera_container.show();
        }
        
        this.camera_active = true;
        
        // Start barcode detection
        this.detect_barcode();
      })
      .catch(err => {
        frappe.show_alert({
          message: __('Error accessing camera: {0}', [err.message]),
          indicator: 'red'
        });
        console.error('Error accessing camera:', err);
      });
    }
  
    stop_camera() {
      if (this.camera_active) {
        if (this.video && this.video.srcObject) {
          const stream = this.video.srcObject;
          const tracks = stream.getTracks();
          
          tracks.forEach(track => track.stop());
          this.video.srcObject = null;
        }
        
        if (this.camera_container) {
          this.camera_container.hide();
        }
        
        this.camera_active = false;
        
        // Stop detection loop
        if (this.detection_loop) {
          cancelAnimationFrame(this.detection_loop);
          this.detection_loop = null;
        }
      }
    }
  
    start_modal_camera() {
      // Check compatibility first
      if (!this.check_compatibility()) {
        frappe.show_alert({
          message: __('Camera access is not supported in this browser'),
          indicator: 'red'
        });
        return;
      }
      
      navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      .then(stream => {
        if (!this.modal_video) {
          console.error('Modal video element not found');
          return;
        }
        
        this.modal_video.srcObject = stream;
        this.modal_video.setAttribute('playsinline', true);
        this.modal_video.play();
        
        this.modal_active = true;
        
        // Start barcode detection
        this.detect_modal_barcode();
      })
      .catch(err => {
        frappe.show_alert({
          message: __('Error accessing camera: {0}', [err.message]),
          indicator: 'red'
        });
        console.error('Error accessing camera:', err);
      });
    }
  
    stop_modal_camera() {
      if (this.modal_active) {
        if (this.modal_video && this.modal_video.srcObject) {
          const stream = this.modal_video.srcObject;
          const tracks = stream.getTracks();
          
          tracks.forEach(track => track.stop());
          this.modal_video.srcObject = null;
        }
        
        this.modal_active = false;
        
        // Stop detection loop
        if (this.modal_detection_loop) {
          cancelAnimationFrame(this.modal_detection_loop);
          this.modal_detection_loop = null;
        }
      }
    }
  
    detect_barcode() {
      if (!this.camera_active) return;
      
      if (this.detector) {
        this.detection_loop = requestAnimationFrame(() => this.detect_with_detector());
      } else if (this.quagga_available) {
        this.detect_with_quagga();
      }
    }
  
    detect_modal_barcode() {
      if (!this.modal_active) return;
      
      if (this.detector) {
        this.modal_detection_loop = requestAnimationFrame(() => this.detect_modal_with_detector());
      } else if (this.quagga_available) {
        this.detect_modal_with_quagga();
      }
    }
  
    detect_with_detector() {
      if (!this.camera_active || !this.detector || !this.video) {
        return;
      }
      
      // Only try to detect when video is playing
      if (this.video.readyState !== this.video.HAVE_ENOUGH_DATA) {
        this.detection_loop = requestAnimationFrame(() => this.detect_with_detector());
        return;
      }
      
      this.detector.detect(this.video)
        .then(barcodes => {
          if (barcodes && barcodes.length > 0) {
            // Get the first detected barcode
            const barcode = barcodes[0];
            
            // Process the detected barcode
            this.process_barcode(barcode.rawValue);
            return;
          }
          
          // Continue detection loop
          this.detection_loop = requestAnimationFrame(() => this.detect_with_detector());
        })
        .catch(err => {
          console.error('Barcode detection error:', err);
          
          // Continue detection loop despite error
          this.detection_loop = requestAnimationFrame(() => this.detect_with_detector());
        });
    }
  
    detect_modal_with_detector() {
      if (!this.modal_active || !this.detector || !this.modal_video) {
        return;
      }
      
      // Only try to detect when video is playing
      if (this.modal_video.readyState !== this.modal_video.HAVE_ENOUGH_DATA) {
        this.modal_detection_loop = requestAnimationFrame(() => this.detect_modal_with_detector());
        return;
      }
      
      this.detector.detect(this.modal_video)
        .then(barcodes => {
          if (barcodes && barcodes.length > 0) {
            // Get the first detected barcode
            const barcode = barcodes[0];
            
            // Process the detected barcode
            this.process_barcode(barcode.rawValue);
            
            // Close the modal after successful detection
            this.modal.modal('hide');
            this.stop_modal_camera();
            return;
          }
          
          // Continue detection loop
          this.modal_detection_loop = requestAnimationFrame(() => this.detect_modal_with_detector());
        })
        .catch(err => {
          console.error('Barcode detection error:', err);
          
          // Continue detection loop despite error
          this.modal_detection_loop = requestAnimationFrame(() => this.detect_modal_with_detector());
        });
    }
  
    detect_with_quagga() {
      if (!this.camera_active || !this.quagga_available || !this.video || !this.canvas) {
        return;
      }
      
      // Only try to detect when video is playing
      if (this.video.readyState !== this.video.HAVE_ENOUGH_DATA) {
        setTimeout(() => {
          this.detect_with_quagga();
        }, 100);
        return;
      }
      
      // Get canvas context
      const context = this.canvas.getContext('2d');
      this.canvas.width = this.video.videoWidth;
      this.canvas.height = this.video.videoHeight;
      
      // Draw current video frame to canvas
      context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
      
      // Get image data URL from canvas
      const imageDataUrl = this.canvas.toDataURL('image/jpeg');
      
      // Initialize Quagga with the image data
      Quagga.decodeSingle({
        decoder: {
          readers: [
            'code_128_reader',
            'ean_reader',
            'ean_8_reader',
            'code_39_reader',
            'code_39_vin_reader',
            'upc_reader',
            'upc_e_reader',
            'i2of5_reader'
          ]
        },
        locate: true,
        src: imageDataUrl
      }, result => {
        if (result && result.codeResult) {
          // Process the detected barcode
          this.process_barcode(result.codeResult.code);
          return;
        }
        
        // Continue detection with a slight delay to prevent excessive processing
        setTimeout(() => {
          this.detect_with_quagga();
        }, 100);
      });
    }
  
    detect_modal_with_quagga() {
      if (!this.modal_active || !this.quagga_available || !this.modal_video || !this.modal_canvas) {
        return;
      }
      
      // Only try to detect when video is playing
      if (this.modal_video.readyState !== this.modal_video.HAVE_ENOUGH_DATA) {
        setTimeout(() => {
          this.detect_modal_with_quagga();
        }, 100);
        return;
      }
      
      // Get canvas context
      const context = this.modal_canvas.getContext('2d');
      this.modal_canvas.width = this.modal_video.videoWidth;
      this.modal_canvas.height = this.modal_video.videoHeight;
      
      // Draw current video frame to canvas
      context.drawImage(this.modal_video, 0, 0, this.modal_canvas.width, this.modal_canvas.height);
      
      // Get image data URL from canvas
      const imageDataUrl = this.modal_canvas.toDataURL('image/jpeg');
      
      // Initialize Quagga with the image data
      Quagga.decodeSingle({
        decoder: {
          readers: [
            'code_128_reader',
            'ean_reader',
            'ean_8_reader',
            'code_39_reader',
            'code_39_vin_reader',
            'upc_reader',
            'upc_e_reader',
            'i2of5_reader'
          ]
        },
        locate: true,
        src: imageDataUrl
      }, result => {
        if (result && result.codeResult) {
          // Process the detected barcode
          this.process_barcode(result.codeResult.code);
          
          // Close the modal after successful detection
          this.modal.modal('hide');
          this.stop_modal_camera();
          return;
        }
        
        // Continue detection with a slight delay to prevent excessive processing
        setTimeout(() => {
          this.detect_modal_with_quagga();
        }, 100);
      });
    }
  
    process_barcode(barcode) {
      if (!barcode) return;
      
      // Show detected barcode
      frappe.show_alert({
        message: __('Barcode detected: {0}', [barcode]),
        indicator: 'green'
      });
      
      // Stop camera after successful detection
      this.stop_camera();
      this.stop_modal_camera();
      
      // Call the callback function with the detected barcode
      if (this.options.callback && typeof this.options.callback === 'function') {
        this.options.callback(barcode);
      }
    }
  }