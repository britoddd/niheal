class KFRECalculator {
  static coefficients = {
    // Original 4-variable model coefficients
    age: -0.1598,
    male: 0.2497,
    egfr: -0.6063,
    ln_acr: 0.4262,
    
    // Extended model coefficients (if needed)
    egrf_slope: 0.285, // for slope < -3 ml/min/1.73 m² per year
    heart_failure: 0.190, // HR ~1.21
  };

  static baselineSurvival5yr = 0.9832;
  static baselineSurvival2yr = 0.996;

  static calculateRisk({ age, sex, egfr, acr, egfr_slope, heart_failure }) {
    // Validate inputs
    const validationErrors = this.validateInputs({ age, sex, egfr, acr });
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join(', '));
    }

    const ln_acr = Math.log(acr);
    
    // Calculate linear predictor for 5-year risk
    const lp_5yr =
      this.coefficients.age * (age / 10) +
      (sex === 'male' ? this.coefficients.male : 0) +
      this.coefficients.egfr * (egfr / 5) +
      this.coefficients.ln_acr * ln_acr;

    // Calculate linear predictor for 2-year risk
    const lp_2yr = lp_5yr; // Same linear predictor, different baseline survival

    // Calculate risks
    const risk5yr = (1 - Math.pow(this.baselineSurvival5yr, Math.exp(lp_5yr))) * 100;
    const risk2yr = (1 - Math.pow(this.baselineSurvival2yr, Math.exp(lp_2yr))) * 100;

    // Apply extended model factors if provided
    let adjustedRisk5yr = risk5yr;
    let adjustedRisk2yr = risk2yr;
    
    if (egfr_slope < -3) {
      adjustedRisk5yr *= 1.32; // HR ~1.32 for rapid decline
      adjustedRisk2yr *= 1.32;
    }
    
    if (heart_failure) {
      adjustedRisk5yr *= 1.21; // HR ~1.21 for heart failure
      adjustedRisk2yr *= 1.21;
    }

    // Determine risk category based on 5-year risk
    let risk_category = 'Low risk';
    if (adjustedRisk5yr >= 15) {
      risk_category = 'High risk';
    } else if (adjustedRisk5yr >= 5) {
      risk_category = 'Intermediate risk';
    }

    return {
      risk_2year: adjustedRisk2yr.toFixed(2),
      risk_5year: adjustedRisk5yr.toFixed(2),
      risk_percentage: adjustedRisk5yr.toFixed(2),
      risk_category,
      linear_predictor: lp_5yr.toFixed(4),
      interpretation: this.getInterpretation(risk_category)
    };
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

  // Method for competing risk model (advanced)
  static calculateCompetingRisk({ age, sex, egfr, acr }) {
    // This implements the competing risk model with spline terms
    const ln_acr = Math.log(acr);
    
    // Simplified competing risk model coefficients
    const coeff = {
      age: -0.300, // per 10 years
      male: 0.260,
      egfr_below45: -0.390, // per 5 ml/min higher below 45
      egfr_above45: -0.170, // per 5 ml/min higher above 45
      ln_acr: 0.400
    };

    const egfr_coeff = egfr < 45 ? coeff.egfr_below45 : coeff.egfr_above45;
    
    const lp = 
      coeff.age * (age / 10) +
      (sex === 'male' ? coeff.male : 0) +
      egfr_coeff * (egfr / 5) +
      coeff.ln_acr * ln_acr;

    const risk5yr = (1 - Math.pow(0.98, Math.exp(lp))) * 100; // Approximate baseline

    let risk_category = 'Low risk';
    if (risk5yr >= 15) risk_category = 'High risk';
    else if (risk5yr >= 5) risk_category = 'Intermediate risk';

    return {
      risk_5year: risk5yr.toFixed(2),
      risk_percentage: risk5yr.toFixed(2),
      risk_category,
      model_type: 'competing_risk'
    };
  }
}

module.exports = KFRECalculator;