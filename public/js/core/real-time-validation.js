// LVS Returns - Real-Time Validation with Visual Feedback
// ============================================

class RealTimeValidator {
  constructor() {
    this.validators = new Map();
    this.validationStates = new Map();
    this.init();
  }

  init() {
    // CSS für Validierungs-Feedback hinzufügen
    this.injectStyles();
  }

  injectStyles() {
    if (document.getElementById('validation-styles')) return;

    const style = document.createElement('style');
    style.id = 'validation-styles';
    style.textContent = `
      .validation-wrapper {
        position: relative;
      }
      
      .validation-feedback {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        margin-top: 4px;
        font-size: 12px;
        padding: 6px 10px;
        border-radius: 6px;
        z-index: 1000;
        animation: slideDown 0.2s ease;
        pointer-events: none;
      }
      
      .validation-feedback.error {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
        border-left: 3px solid #ef4444;
      }
      
      .validation-feedback.success {
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
        border-left: 3px solid #10b981;
      }
      
      .validation-feedback.warning {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
        border-left: 3px solid #f59e0b;
      }
      
      .validation-feedback.info {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
        border-left: 3px solid #3b82f6;
      }
      
      input.validation-error,
      select.validation-error,
      textarea.validation-error {
        border-color: #ef4444 !important;
        border-width: 2px !important;
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
        animation: shake 0.3s ease;
      }
      
      input.validation-success,
      select.validation-success,
      textarea.validation-success {
        border-color: #10b981 !important;
        border-width: 2px !important;
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1) !important;
      }
      
      input.validation-warning,
      select.validation-warning,
      textarea.validation-warning {
        border-color: #f59e0b !important;
        border-width: 2px !important;
        box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1) !important;
      }
      
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
      }
      
      .validation-icon {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 18px;
        pointer-events: none;
        z-index: 10;
      }
      
      .validation-icon.error { color: #ef4444; }
      .validation-icon.success { color: #10b981; }
      .validation-icon.warning { color: #f59e0b; }
    `;
    document.head.appendChild(style);
  }

  /**
   * Registriert ein Input-Feld für Echtzeit-Validierung
   * @param {string} fieldId - ID des Input-Felds
   * @param {Function} validator - Validierungs-Funktion (value) => { valid: boolean, message: string, type: 'error'|'success'|'warning' }
   * @param {object} options - Optionen
   */
  register(fieldId, validator, options = {}) {
    const field = document.getElementById(fieldId);
    if (!field) {
      console.warn(`⚠️ Feld '${fieldId}' nicht gefunden`);
      return;
    }

    // Wrapper erstellen falls nicht vorhanden
    if (!field.parentElement.classList.contains('validation-wrapper')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'validation-wrapper';
      field.parentNode.insertBefore(wrapper, field);
      wrapper.appendChild(field);
    }

    // Feedback-Element erstellen
    let feedbackEl = document.getElementById(`${fieldId}-feedback`);
    if (!feedbackEl) {
      feedbackEl = document.createElement('div');
      feedbackEl.id = `${fieldId}-feedback`;
      feedbackEl.className = 'validation-feedback';
      field.parentElement.appendChild(feedbackEl);
    }

    // Icon-Element erstellen
    let iconEl = document.getElementById(`${fieldId}-icon`);
    if (!iconEl) {
      iconEl = document.createElement('span');
      iconEl.id = `${fieldId}-icon`;
      iconEl.className = 'validation-icon';
      field.parentElement.appendChild(iconEl);
    }

    // Event-Listener hinzufügen
    const validate = async (e) => {
      const value = field.value;
      
      // Debounce wenn gewünscht
      if (options.debounce) {
        clearTimeout(this.validationStates.get(`${fieldId}-timeout`));
        const timeout = setTimeout(() => {
          this.runValidation(fieldId, value, validator, feedbackEl, iconEl, field);
        }, options.debounce);
        this.validationStates.set(`${fieldId}-timeout`, timeout);
      } else {
        await this.runValidation(fieldId, value, validator, feedbackEl, iconEl, field);
      }
    };

    // Events
    field.addEventListener('input', validate);
    field.addEventListener('blur', validate);
    
    // Initial-Validierung
    if (field.value) {
      validate();
    }

    this.validators.set(fieldId, { validator, options, field, feedbackEl, iconEl });
  }

  async runValidation(fieldId, value, validator, feedbackEl, iconEl, field) {
    try {
      const result = await validator(value);
      
      // State speichern
      this.validationStates.set(fieldId, result);
      
      // Visuelles Feedback
      this.updateFeedback(field, feedbackEl, iconEl, result);
      
      return result;
    } catch (err) {
      console.error(`❌ Validierungsfehler für '${fieldId}':`, err);
      this.updateFeedback(field, feedbackEl, iconEl, {
        valid: false,
        message: 'Validierungsfehler',
        type: 'error'
      });
    }
  }

  updateFeedback(field, feedbackEl, iconEl, result) {
    // Klassen entfernen
    field.classList.remove('validation-error', 'validation-success', 'validation-warning');
    feedbackEl.classList.remove('error', 'success', 'warning', 'info');
    iconEl.classList.remove('error', 'success', 'warning');
    iconEl.textContent = '';

    if (!result) return;

    const { valid, message, type = valid ? 'success' : 'error' } = result;

    if (message) {
      feedbackEl.textContent = message;
      feedbackEl.className = `validation-feedback ${type}`;
      feedbackEl.style.display = 'block';
    } else {
      feedbackEl.style.display = 'none';
    }

    // Icon
    if (type === 'error') {
      field.classList.add('validation-error');
      iconEl.classList.add('error');
      iconEl.textContent = '❌';
    } else if (type === 'success') {
      field.classList.add('validation-success');
      iconEl.classList.add('success');
      iconEl.textContent = '✓';
    } else if (type === 'warning') {
      field.classList.add('validation-warning');
      iconEl.classList.add('warning');
      iconEl.textContent = '⚠️';
    }
  }

  /**
   * Prüft ob ein Feld gültig ist
   */
  isValid(fieldId) {
    const state = this.validationStates.get(fieldId);
    return state?.valid !== false;
  }

  /**
   * Prüft ob alle registrierten Felder gültig sind
   */
  areAllValid() {
    for (const [fieldId, state] of this.validationStates) {
      if (state.valid === false) {
        return false;
      }
    }
    return true;
  }

  /**
   * Validiert alle Felder
   */
  async validateAll() {
    const promises = [];
    for (const [fieldId, { validator, field }] of this.validators) {
      promises.push(
        this.runValidation(
          fieldId,
          field.value,
          validator,
          document.getElementById(`${fieldId}-feedback`),
          document.getElementById(`${fieldId}-icon`),
          field
        )
      );
    }
    await Promise.all(promises);
    return this.areAllValid();
  }

  /**
   * Entfernt Validierung von einem Feld
   */
  unregister(fieldId) {
    this.validators.delete(fieldId);
    this.validationStates.delete(fieldId);
  }
}

// Globale Instanz
window.realTimeValidator = window.realTimeValidator || new RealTimeValidator();

// Convenience Functions
window.validateField = (fieldId, validator, options) => {
  window.realTimeValidator.register(fieldId, validator, options);
};

window.isFieldValid = (fieldId) => {
  return window.realTimeValidator.isValid(fieldId);
};

window.validateAllFields = () => {
  return window.realTimeValidator.validateAll();
};

console.log('✅ Real-Time Validation initialisiert');
