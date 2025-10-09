class CancerRiskCalculator {
    static calculateRisk(inputs, coefficients) {
        const { cancer_type, sex, ...factors } = inputs;
        
        // Filter coefficients for the specific cancer type
        const cancerCoeffs = coefficients.filter(coeff => coeff.cancer_type === cancer_type);
        
        if (cancerCoeffs.length === 0) {
            throw new Error(`No coefficients found for cancer type: ${cancer_type}`);
        }

        // Calculate linear predictor using cancer-specific formula
        let linearPredictor = 0;
        const appliedFactors = {};

        // Cancer-specific calculations
        switch(cancer_type) {
            case 'prostate':
                linearPredictor = this.calculateProstateRisk(factors, cancerCoeffs, appliedFactors);
                break;
            case 'lung':
                linearPredictor = this.calculateLungRisk(factors, cancerCoeffs, appliedFactors);
                break;
            case 'breast':
                linearPredictor = this.calculateBreastRisk(factors, cancerCoeffs, appliedFactors);
                break;
            case 'colorectal':
                linearPredictor = this.calculateColorectalRisk(factors, cancerCoeffs, appliedFactors, sex);
                break;
            default:
                // Generic calculation for other cancer types
                cancerCoeffs.forEach(coeff => {
                    const factorValue = this.getFactorValue(factors, coeff.variable);
                    const contribution = coeff.beta_value * factorValue;
                    linearPredictor += contribution;
                    appliedFactors[coeff.variable] = {
                        value: factorValue,
                        beta: coeff.beta_value,
                        contribution: contribution
                    };
                });
        }

        // Get base incidence for this cancer type
        const baseIncidence = cancerCoeffs[0].base_incidence;
        
        // Calculate absolute risk using appropriate transformation
        const absoluteRisk = this.calculateAbsoluteRisk(linearPredictor, baseIncidence, cancer_type);
        
        // Determine risk category
        const riskCategory = this.getRiskCategory(absoluteRisk, cancer_type);
        
        return {
            risk_percentage: Math.min(parseFloat(absoluteRisk.toFixed(2)), 99.99),
            risk_category: riskCategory,
            linear_predictor: linearPredictor.toFixed(4),
            base_incidence: baseIncidence,
            applied_factors: appliedFactors,
            cancer_type: cancer_type,
            message: this.getRiskMessage(riskCategory, cancer_type)
        };
    }

    static calculateProstateRisk(factors, coefficients, appliedFactors) {
        let linearPredictor = 0;
        
        coefficients.forEach(coeff => {
            let factorValue = 0;
            
            switch(coeff.variable) {
                case 'age':
                    factorValue = (factors.age - 60) / 10; // Centered around 60
                    break;
                case 'psa_log2':
                    factorValue = factors.psa ? Math.log2(factors.psa) : 0;
                    break;
                case 'dre_abnormal':
                    factorValue = factors.dre_abnormal ? 1 : 0;
                    break;
                case 'african_american':
                    factorValue = factors.african_american ? 1 : 0;
                    break;
                case 'prior_biopsy':
                    factorValue = factors.prior_biopsy ? 1 : 0;
                    break;
                case 'family_history':
                    factorValue = factors.family_history ? 1 : 0;
                    break;
                case 'free_psa_percent':
                    factorValue = factors.free_psa_percent ? factors.free_psa_percent : 20; // Default 20%
                    break;
                default:
                    factorValue = this.getFactorValue(factors, coeff.variable);
            }
            
            const contribution = coeff.beta_value * factorValue;
            linearPredictor += contribution;
            appliedFactors[coeff.variable] = {
                value: factorValue,
                beta: coeff.beta_value,
                contribution: contribution
            };
        });
        
        return linearPredictor;
    }

    static calculateLungRisk(factors, coefficients, appliedFactors) {
        let linearPredictor = 0;
        
        coefficients.forEach(coeff => {
            let factorValue = 0;
            
            switch(coeff.variable) {
                case 'age':
                    factorValue = (factors.age - 60) / 5; // Scaled
                    break;
                case 'smoking_duration':
                    factorValue = factors.smoking_years || 0;
                    break;
                case 'cigarettes_per_day':
                    factorValue = factors.cigarettes_per_day || 0;
                    break;
                case 'quit_time':
                    factorValue = factors.years_since_quit || 0;
                    break;
                case 'bmi':
                    factorValue = factors.bmi ? (factors.bmi - 25) / 5 : 0; // Centered around 25
                    break;
                case 'copd':
                    factorValue = factors.copd ? 1 : 0;
                    break;
                case 'family_history_lung':
                    factorValue = factors.family_history ? 1 : 0;
                    break;
                case 'personal_cancer_history':
                    factorValue = factors.personal_cancer_history ? 1 : 0;
                    break;
                case 'education':
                    factorValue = factors.education_years ? (16 - factors.education_years) : 0; // Inverse relationship
                    break;
                case 'asbestos_exposure':
                    factorValue = factors.asbestos_exposure ? 1 : 0;
                    break;
                default:
                    factorValue = this.getFactorValue(factors, coeff.variable);
            }
            
            const contribution = coeff.beta_value * factorValue;
            linearPredictor += contribution;
            appliedFactors[coeff.variable] = {
                value: factorValue,
                beta: coeff.beta_value,
                contribution: contribution
            };
        });
        
        return linearPredictor;
    }

    static calculateBreastRisk(factors, coefficients, appliedFactors) {
        let linearPredictor = 0;
        
        coefficients.forEach(coeff => {
            let factorValue = 0;
            
            switch(coeff.variable) {
                case 'age':
                    factorValue = (factors.age - 50) / 10; // Centered around 50
                    break;
                case 'age_menarche':
                    factorValue = factors.menarche_age ? (14 - factors.menarche_age) : 0; // Inverse relationship
                    break;
                case 'age_first_birth':
                    factorValue = factors.age_first_birth ? (factors.age_first_birth - 25) / 5 : 0; // Centered around 25
                    break;
                case 'first_degree_relatives':
                    factorValue = factors.first_degree_relatives || 0;
                    break;
                case 'breast_biopsies':
                    factorValue = factors.breast_biopsies || 0;
                    break;
                case 'atypical_hyperplasia':
                    factorValue = factors.atypical_hyperplasia ? 1 : 0;
                    break;
                case 'bmi':
                    factorValue = factors.bmi ? (factors.bmi - 25) / 5 : 0;
                    break;
                case 'hormone_therapy':
                    factorValue = factors.hormone_therapy ? 1 : 0;
                    break;
                case 'alcohol_consumption':
                    factorValue = factors.alcohol_consumption || 0;
                    break;
                default:
                    factorValue = this.getFactorValue(factors, coeff.variable);
            }
            
            const contribution = coeff.beta_value * factorValue;
            linearPredictor += contribution;
            appliedFactors[coeff.variable] = {
                value: factorValue,
                beta: coeff.beta_value,
                contribution: contribution
            };
        });
        
        return linearPredictor;
    }

    static calculateColorectalRisk(factors, coefficients, appliedFactors, sex) {
        let linearPredictor = 0;
        
        coefficients.forEach(coeff => {
            let factorValue = 0;
            
            // Skip estrogen use for males
            if (coeff.variable === 'estrogen_use' && sex === 'male') {
                return;
            }
            
            switch(coeff.variable) {
                case 'age':
                    factorValue = (factors.age - 60) / 10;
                    break;
                case 'bmi':
                    factorValue = factors.bmi ? (factors.bmi - 25) / 5 : 0;
                    break;
                case 'smoking_pack_years':
                    factorValue = factors.smoking_pack_years || 0;
                    break;
                case 'alcohol_drinks_day':
                    factorValue = factors.alcohol_drinks_day || 0;
                    break;
                case 'red_meat_oz':
                    factorValue = factors.red_meat_oz || 0;
                    break;
                case 'family_history_colon':
                    factorValue = factors.family_history_colon ? 1 : 0;
                    break;
                case 'diabetes':
                    factorValue = factors.diabetes ? 1 : 0;
                    break;
                case 'physical_activity':
                    factorValue = factors.physical_activity || 0;
                    break;
                case 'aspirin_use':
                    factorValue = factors.aspirin_use ? 1 : 0;
                    break;
                case 'multivitamin_use':
                    factorValue = factors.multivitamin_use ? 1 : 0;
                    break;
                case 'education_years':
                    factorValue = factors.education_years ? (16 - factors.education_years) : 0;
                    break;
                case 'nsaid_use':
                    factorValue = factors.nsaid_use ? 1 : 0;
                    break;
                case 'estrogen_use':
                    factorValue = factors.estrogen_use ? 1 : 0;
                    break;
                default:
                    factorValue = this.getFactorValue(factors, coeff.variable);
            }
            
            const contribution = coeff.beta_value * factorValue;
            linearPredictor += contribution;
            appliedFactors[coeff.variable] = {
                value: factorValue,
                beta: coeff.beta_value,
                contribution: contribution
            };
        });
        
        return linearPredictor;
    }

    static getFactorValue(factors, variable) {
        // Handle nested variables and defaults
        const value = factors[variable];
        if (value === undefined || value === null) {
            return 0;
        }
        return typeof value === 'number' ? value : (value ? 1 : 0);
    }

    static calculateAbsoluteRisk(linearPredictor, baseIncidence, cancerType) {
        // Use logistic function for probability transformation
        const probability = 1 / (1 + Math.exp(-linearPredictor));
        
        // Scale by base incidence and convert to percentage
        let absoluteRisk;
        
        switch(cancerType) {
            case 'lung':
                // PLCOm2012 model uses 6-year risk
                absoluteRisk = (baseIncidence * probability) * 100;
                break;
            case 'breast':
                // Gail model uses 5-year risk
                absoluteRisk = (baseIncidence * probability) * 100;
                break;
            case 'colorectal':
                // CRC-PRO uses 10-year risk
                absoluteRisk = (baseIncidence * probability) * 100;
                break;
            case 'prostate':
                // PCPTRC 2.0 - high-grade cancer risk
                absoluteRisk = (baseIncidence * probability) * 100;
                break;
            default:
                absoluteRisk = (baseIncidence * probability) * 100;
        }
        
        return Math.max(0.1, Math.min(absoluteRisk, 50)); // Cap at reasonable levels
    }

    static getRiskCategory(riskPercentage, cancer_type) {
        const thresholds = {
            'prostate': { low: 3, moderate: 8, high: 15 },
            'lung': { low: 1.5, moderate: 5, high: 10 },
            'breast': { low: 1.5, moderate: 3, high: 8 },
            'colorectal': { low: 1, moderate: 3, high: 6 }
        };
        
        const threshold = thresholds[cancer_type] || thresholds['breast'];
        
        if (riskPercentage < threshold.low) return 'Low';
        if (riskPercentage < threshold.moderate) return 'Moderate';
        if (riskPercentage < threshold.high) return 'High';
        return 'Very High';
    }

    static getRiskMessage(category, cancer_type) {
        const messages = {
            'Low': `Your ${cancer_type} cancer risk is lower than average. Continue healthy habits and regular screenings as recommended.`,
            'Moderate': `Your ${cancer_type} cancer risk is moderate. Consider discussing screening options with your healthcare provider.`,
            'High': `Your ${cancer_type} cancer risk is elevated. We recommend consulting with a healthcare provider about appropriate screening and prevention strategies.`,
            'Very High': `Your ${cancer_type} cancer risk is significantly elevated. Immediate consultation with a healthcare provider is recommended for appropriate screening and management.`
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

        // Additional validations based on cancer type
        switch(cancer_type) {
            case 'prostate':
                if (inputs.psa && (inputs.psa < 0.1 || inputs.psa > 100)) {
                    errors.push("PSA value should be between 0.1-100 ng/mL");
                }
                if (inputs.free_psa_percent && (inputs.free_psa_percent < 1 || inputs.free_psa_percent > 100)) {
                    errors.push("Free PSA percentage should be between 1-100%");
                }
                break;
            case 'lung':
                if (inputs.smoking_years && inputs.smoking_years > 80) {
                    errors.push("Smoking years should be reasonable (0-80 years)");
                }
                break;
            case 'breast':
                if (inputs.menarche_age && (inputs.menarche_age < 8 || inputs.menarche_age > 20)) {
                    errors.push("Age at menarche should be between 8-20 years");
                }
                break;
        }

        return errors;
    }
}

module.exports = CancerRiskCalculator;