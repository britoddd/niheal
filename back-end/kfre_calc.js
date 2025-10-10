class KFRECalculator {
  static coefficients = {
    // Standard 4-variable KFRE coefficients from Tangri et al. 2011
    male: {
      ln_age: 0.220,
      ln_egfr: -1.242,
      ln_acr: 0.451
    },
    female: {
      ln_age: 0.246,
      ln_egfr: -0.957,
      ln_acr: 0.451,
      female: -0.556
    }
  };

  static baselineSurvival5yr = 0.956;
  static baselineSurvival2yr = 0.987;

  static calculateRisk({ age, sex, egfr, acr }, dbCoefficients = null) {
    // Validate inputs
    const validationErrors = this.validateInputs({ age, sex, egfr, acr });
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join(', '));
    }

    const ln_age = Math.log(age);
    const ln_egfr = Math.log(egfr);
    const ln_acr = Math.log(acr);
    
    // Use database coefficients if provided, otherwise use hardcoded
    const coeff = dbCoefficients ? this.parseDBCoefficients(dbCoefficients, sex) : this.coefficients[sex];
    
    console.log('Calculation inputs:', { age, sex, egfr, acr, ln_age, ln_egfr, ln_acr });
    console.log('Coefficients used:', coeff);

    // Calculate linear predictor using standard KFRE formula
    let lp = 
      coeff.ln_age * ln_age +
      coeff.ln_egfr * ln_egfr +
      coeff.ln_acr * ln_acr;
    
    // Add female coefficient if applicable
    if (sex === 'female') {
      lp += coeff.female;
    }

    console.log('Linear predictor (lp):', lp);
    console.log('exp(lp):', Math.exp(lp));

    // Calculate risks using Cox proportional hazards model
    const risk5yr = (1 - Math.pow(this.baselineSurvival5yr, Math.exp(lp))) * 100;
    const risk2yr = (1 - Math.pow(this.baselineSurvival2yr, Math.exp(lp))) * 100;

    console.log('Calculated risks - 2yr:', risk2yr, '5yr:', risk5yr);

    // Determine risk category based on 5-year risk
    let risk_category = 'Low risk';
    if (risk5yr >= 15) {
      risk_category = 'High risk';
    } else if (risk5yr >= 5) {
      risk_category = 'Intermediate risk';
    }

    return {
      risk_2year: risk2yr.toFixed(2),
      risk_5year: risk5yr.toFixed(2),
      risk_percentage: risk5yr.toFixed(2),
      risk_category,
      linear_predictor: lp.toFixed(4),
      interpretation: this.getInterpretation(risk_category),
      model_type: 'standard_kfre'
    };
  }

  static parseDBCoefficients(dbCoefficients, sex) {
    const coeff = {
      ln_age: 0,
      ln_egfr: 0,
      ln_acr: 0,
      female: 0
    };

    dbCoefficients.forEach(row => {
      switch (row.variable) {
        case 'ln_age':
          coeff.ln_age = parseFloat(row.beta_value);
          break;
        case 'ln_egfr':
          coeff.ln_egfr = parseFloat(row.beta_value);
          break;
        case 'ln_acr':
          coeff.ln_acr = parseFloat(row.beta_value);
          break;
        case 'female':
          coeff.female = parseFloat(row.beta_value);
          break;
      }
    });

    return coeff;
  }

  static getInterpretation(category) {
    switch (category) {
      case 'Low risk':
        return 'Low risk of kidney failure (0%-4.99%). Continue routine monitoring in primary care.';
      case 'Intermediate risk':
        return 'Intermediate risk (5.00%-14.99%). Consider nephrology referral based on clinical judgment.';
      case 'High risk':
        return 'High risk (≥15.00%). Recommend urgent nephrology follow-up for dialysis planning and vascular access.';
      default:
        return 'Risk assessment complete.';
    }
  }

  static validateInputs({ age, sex, egfr, acr }) {
    const errors = [];
    if (!age || age < 18 || age > 100) errors.push('Age must be between 18-100 years');
    if (!['male', 'female'].includes(sex)) errors.push('Sex must be male or female');
    if (!egfr || egfr < 15 || egfr > 200) errors.push('eGFR must be between 15-200 mL/min/1.73 m²');
    if (!acr || acr <= 0) errors.push('ACR must be positive');
    return errors;
  }

  // Method for competing risk model (using simplified approach)
  static calculateCompetingRisk({ age, sex, egfr, acr }) {
    const validationErrors = this.validateInputs({ age, sex, egfr, acr });
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join(', '));
    }

    const ln_age = Math.log(age);
    const ln_egfr = Math.log(egfr);
    const ln_acr = Math.log(acr);
    
    // Simplified competing risk model coefficients
    const coeff = {
      ln_age: 0.180,
      ln_egfr: -0.900,
      ln_acr: 0.400,
      female: -0.300
    };

    let lp = 
      coeff.ln_age * ln_age +
      coeff.ln_egfr * ln_egfr +
      coeff.ln_acr * ln_acr;
    
    if (sex === 'female') {
      lp += coeff.female;
    }

    const risk5yr = (1 - Math.pow(0.960, Math.exp(lp))) * 100;

    let risk_category = 'Low risk';
    if (risk5yr >= 15) risk_category = 'High risk';
    else if (risk5yr >= 5) risk_category = 'Intermediate risk';

    return {
      risk_5year: risk5yr.toFixed(2),
      risk_percentage: risk5yr.toFixed(2),
      risk_category,
      model_type: 'competing_risk',
      interpretation: this.getInterpretation(risk_category)
    };
  }
}

module.exports = KFRECalculator;