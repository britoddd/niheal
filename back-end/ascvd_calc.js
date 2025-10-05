/**
 * ASCVD Risk Calculator using 2023 PREVENT Equations
 * 
 * This module contains the core logic for calculating ASCVD risk
 * using the race-free PREVENT model from AHA.
 */

class ASCVDCalculator {
    /**
     * Calculate 10-year ASCVD risk using PREVENT equations
     * @param {Object} inputs - Patient data
     * @param {Object} coefficients - Model coefficients from database
     * @returns {Object} Risk calculation results
     */
    static calculateRisk(inputs, coefficients) {
        const {
            age, systolic_bp, total_chol, hdl_chol, egfr,
            is_smoker, is_diabetic, is_treated_bp, is_treated_chol
        } = inputs;

        console.log('Inputs received:', inputs);

        // Validate inputs with more flexible ranges
        this.validateInputs(inputs);

        // For ages outside 30-79, provide educational feedback instead of strict calculation
        if (age < 20 || age > 85) {
            return this.getEducationalResult(inputs);
        }

        // Transform variables according to PREVENT model
        const transformed = this.transformVariables(inputs);

        // Calculate linear predictor
        const linearPredictor = this.calculateLinearPredictor(transformed, coefficients);

        // Calculate risk percentage
        const riskResult = this.calculateRiskPercentage(linearPredictor, coefficients);

        return riskResult;
    }

    /**
     * Validate input parameters with more flexible ranges
     */
    static validateInputs(inputs) {
        const { age, systolic_bp, total_chol, hdl_chol, egfr } = inputs;

        if (!age || age < 18 || age > 100) {
            throw new Error('Age must be between 18-100 years');
        }

        if (!systolic_bp || systolic_bp < 80 || systolic_bp > 250) {
            throw new Error('Systolic BP must be between 80-250 mmHg');
        }

        if (!total_chol || total_chol < 100 || total_chol > 400) {
            throw new Error('Total cholesterol must be between 100-400 mg/dL');
        }

        if (!hdl_chol || hdl_chol < 20 || hdl_chol > 100) {
            throw new Error('HDL cholesterol must be between 20-100 mg/dL');
        }

        if (!egfr || egfr < 15 || egfr > 120) {
            throw new Error('eGFR must be between 15-120 mL/min/1.73m²');
        }
    }

    /**
     * Provide educational results for ages outside the standard calculation range
     */
    static getEducationalResult(inputs) {
        const { age, is_smoker, is_diabetic, systolic_bp, total_chol, hdl_chol } = inputs;
        
        let risk_percentage = 0;
        let risk_category = 'Low';
        let message = '';

        if (age < 20) {
            risk_percentage = 0.5; // Very low baseline for young adults
            risk_category = 'Very Low';
            message = 'At your age, ASCVD risk is generally very low. Focus on maintaining healthy habits!';
        } else if (age > 85) {
            risk_percentage = 15; // Higher baseline for elderly
            risk_category = 'Educational';
            message = 'For seniors, individual health factors and medical history are most important. Consult your doctor.';
        }

        // Adjust based on risk factors
        if (is_smoker) risk_percentage += 2;
        if (is_diabetic) risk_percentage += 3;
        if (systolic_bp > 140) risk_percentage += 2;
        if (total_chol > 240 || hdl_chol < 40) risk_percentage += 1;

        // Cap at reasonable values
        risk_percentage = Math.min(risk_percentage, 25);

        return {
            risk_percentage: parseFloat(risk_percentage.toFixed(2)),
            risk_category,
            message,
            is_educational: true,
            linear_predictor: 0,
            survival_probability: 1 - (risk_percentage / 100),
            exp_lp: 1,
            base_survival: 0.95
        };
    }

    /**
     * Transform variables for the model
     */
    static transformVariables(inputs) {
        const { age, systolic_bp, egfr } = inputs;

        return {
            age_sqrt: Math.sqrt(age),
            log_sbp: Math.log(systolic_bp),
            log_egfr: Math.log(egfr),
            ...inputs
        };
    }

    /**
     * Calculate linear predictor (individual_sum - mean_sum)
     */
    static calculateLinearPredictor(transformed, coefficients) {
        let individual_sum = 0;
        let mean_sum = 0;

        // Calculate individual sum (β * x)
        individual_sum += this.getCoefficientValue(coefficients, 'age_sqrt', 'beta_value') * transformed.age_sqrt;
        individual_sum += this.getCoefficientValue(coefficients, 'log_sbp', 'beta_value') * transformed.log_sbp;
        individual_sum += this.getCoefficientValue(coefficients, 'total_chol', 'beta_value') * transformed.total_chol;
        individual_sum += this.getCoefficientValue(coefficients, 'hdl_chol', 'beta_value') * transformed.hdl_chol;
        individual_sum += this.getCoefficientValue(coefficients, 'log_egfr', 'beta_value') * transformed.log_egfr;
        individual_sum += this.getCoefficientValue(coefficients, 'smoker', 'beta_value') * (transformed.is_smoker ? 1 : 0);
        individual_sum += this.getCoefficientValue(coefficients, 'diabetic', 'beta_value') * (transformed.is_diabetic ? 1 : 0);
        individual_sum += this.getCoefficientValue(coefficients, 'bp_treated', 'beta_value') * (transformed.is_treated_bp ? 1 : 0);
        individual_sum += this.getCoefficientValue(coefficients, 'chol_treated', 'beta_value') * (transformed.is_treated_chol ? 1 : 0);

        // Calculate mean sum (β * μ)
        mean_sum += this.getCoefficientValue(coefficients, 'age_sqrt', 'beta_value') * this.getCoefficientValue(coefficients, 'age_sqrt', 'mean_value');
        mean_sum += this.getCoefficientValue(coefficients, 'log_sbp', 'beta_value') * this.getCoefficientValue(coefficients, 'log_sbp', 'mean_value');
        mean_sum += this.getCoefficientValue(coefficients, 'total_chol', 'beta_value') * this.getCoefficientValue(coefficients, 'total_chol', 'mean_value');
        mean_sum += this.getCoefficientValue(coefficients, 'hdl_chol', 'beta_value') * this.getCoefficientValue(coefficients, 'hdl_chol', 'mean_value');
        mean_sum += this.getCoefficientValue(coefficients, 'log_egfr', 'beta_value') * this.getCoefficientValue(coefficients, 'log_egfr', 'mean_value');
        mean_sum += this.getCoefficientValue(coefficients, 'smoker', 'beta_value') * this.getCoefficientValue(coefficients, 'smoker', 'mean_value');
        mean_sum += this.getCoefficientValue(coefficients, 'diabetic', 'beta_value') * this.getCoefficientValue(coefficients, 'diabetic', 'mean_value');
        mean_sum += this.getCoefficientValue(coefficients, 'bp_treated', 'beta_value') * this.getCoefficientValue(coefficients, 'bp_treated', 'mean_value');
        mean_sum += this.getCoefficientValue(coefficients, 'chol_treated', 'beta_value') * this.getCoefficientValue(coefficients, 'chol_treated', 'mean_value');

        return individual_sum - mean_sum;
    }

    /**
     * Safely get coefficient value with error handling
     */
    static getCoefficientValue(coefficients, variable, field) {
        if (!coefficients[variable]) {
            throw new Error(`Missing coefficient for variable: ${variable}`);
        }
        if (coefficients[variable][field] === undefined || coefficients[variable][field] === null) {
            throw new Error(`Missing ${field} for variable: ${variable}`);
        }
        return parseFloat(coefficients[variable][field]);
    }

    /**
     * Calculate final risk percentage
     */
    static calculateRiskPercentage(linearPredictor, coefficients) {
        // Get base survival from any coefficient (they're all the same for a sex)
        const base_survival = this.getCoefficientValue(coefficients, 'age_sqrt', 'base_survival_10yr');
        
        console.log('Base survival value:', base_survival);
        console.log('Linear predictor:', linearPredictor);

        const exp_lp = Math.exp(linearPredictor);
        const survival_probability = Math.pow(base_survival, exp_lp);
        const risk_percentage = (1 - survival_probability) * 100;

        console.log('Exp LP:', exp_lp);
        console.log('Survival probability:', survival_probability);
        console.log('Risk percentage:', risk_percentage);

        // Determine risk category
        const risk_category = this.getRiskCategory(risk_percentage);

        return {
            risk_percentage: parseFloat(risk_percentage.toFixed(2)),
            risk_category,
            linear_predictor: parseFloat(linearPredictor.toFixed(4)),
            survival_probability: parseFloat(survival_probability.toFixed(4)),
            exp_lp: parseFloat(exp_lp.toFixed(4)),
            base_survival: parseFloat(base_survival.toFixed(4))
        };
    }

    /**
     * Determine risk category based on percentage
     */
    static getRiskCategory(riskPercentage) {
        if (riskPercentage < 5) return 'Low';
        if (riskPercentage < 7.5) return 'Borderline';
        if (riskPercentage < 20) return 'Intermediate';
        return 'High';
    }

    /**
     * Get interpretation message for risk category
     */
    static getInterpretation(riskCategory) {
        const interpretations = {
            'Low': 'Maintain healthy lifestyle with regular checkups.',
            'Borderline': 'Consider lifestyle modifications and discuss with healthcare provider.',
            'Intermediate': 'Consult healthcare provider for comprehensive risk assessment.',
            'High': 'Immediate medical consultation recommended for preventive strategies.',
            'Very Low': 'Keep up the good work! Maintain healthy habits for lifelong heart health.',
            'Educational': 'This estimate is for educational purposes. Consult healthcare provider for personalized assessment.'
        };
        return interpretations[riskCategory] || 'Please consult healthcare provider.';
    }
}

module.exports = ASCVDCalculator;