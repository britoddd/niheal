class CancerRiskCalculator {
    static calculateRisk(inputs, coefficients) {
        const { cancer_type, sex, ...factors } = inputs;
        
        // Filter coefficients for the specific cancer type
        const cancerCoeffs = coefficients.filter(coeff => coeff.cancer_type === cancer_type);
        
        if (cancerCoeffs.length === 0) {
            throw new Error(`No coefficients found for cancer type: ${cancer_type}`);
        }

        // Calculate linear predictor
        let linearPredictor = 0;
        const appliedFactors = {};

        cancerCoeffs.forEach(coeff => {
            const factorValue = factors[coeff.variable] || 0;
            linearPredictor += coeff.beta_value * factorValue;
            appliedFactors[coeff.variable] = {
                value: factorValue,
                beta: coeff.beta_value,
                contribution: coeff.beta_value * factorValue
            };
        });

        // Get base incidence for this cancer type
        const baseIncidence = cancerCoeffs[0].base_incidence;
        
        // Calculate absolute risk using logistic function
        const relativeRisk = Math.exp(linearPredictor);
        const absoluteRisk = (baseIncidence * relativeRisk) * 100;
        
        // Determine risk category
        const riskCategory = this.getRiskCategory(absoluteRisk, cancer_type);
        
        return {
            risk_percentage: Math.min(absoluteRisk.toFixed(2), 99.99),
            risk_category: riskCategory,
            relative_risk: relativeRisk.toFixed(2),
            linear_predictor: linearPredictor.toFixed(4),
            base_incidence: baseIncidence,
            applied_factors: appliedFactors,
            cancer_type: cancer_type,
            message: this.getRiskMessage(riskCategory, cancer_type)
        };
    }

    static getRiskCategory(riskPercentage, cancer_type) {
        if (riskPercentage < 5) return 'Low';
        if (riskPercentage < 15) return 'Moderate';
        if (riskPercentage < 30) return 'High';
        return 'Very High';
    }

    static getRiskMessage(category, cancer_type) {
        const messages = {
            'Low': `Your ${cancer_type} cancer risk is lower than average. Continue healthy habits.`,
            'Moderate': `Your ${cancer_type} cancer risk is moderate. Consider regular screening.`,
            'High': `Your ${cancer_type} cancer risk is elevated. Consult with a healthcare provider.`,
            'Very High': `Your ${cancer_type} cancer risk is significantly elevated. Immediate consultation recommended.`
        };
        return messages[category] || 'Risk assessment completed.';
    }

    static validateInputs(inputs) {
        const errors = [];
        const { cancer_type, age, sex } = inputs;

        if (!cancer_type) errors.push("Cancer type is required");
        if (!age || age < 18 || age > 100) errors.push("Age must be between 18-100 years");
        if (!sex || !['male', 'female'].includes(sex)) errors.push("Sex must be male or female");

        // Cancer-specific validations
        if (cancer_type === 'breast' && sex === 'male') {
            errors.push("Breast cancer assessment is typically for females");
        }
        if (cancer_type === 'prostate' && sex === 'female') {
            errors.push("Prostate cancer assessment is for males only");
        }

        return errors;
    }
}

module.exports = CancerRiskCalculator;