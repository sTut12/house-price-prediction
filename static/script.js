const tabs = document.querySelectorAll('.tab-button');
const tabPanels = document.querySelectorAll('.tab-panel');
const compareSubmit = document.getElementById('compareSubmit');
const marketSubmit = document.getElementById('marketSubmit');
const salesToggle = document.getElementById('salesToggle');
const marketWeightLabel = document.getElementById('marketWeightLabel');
const pricePerSqft = document.getElementById('pricePerSqft');
const areaInput = document.getElementById('singleArea');
const toast = document.getElementById('toast');
const trendBars = document.querySelectorAll('.trend-bar');

const state = {
    selectedAmenities: new Set()
};

const advisorCard = document.getElementById('advisorCard');
const advisorNote = document.getElementById('advisorNote');

function setActiveTab(tabName) {
    tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.tab === tabName));
    tabPanels.forEach(panel => panel.classList.toggle('active', panel.id === tabName));
}

tabs.forEach(tab => {
    tab.addEventListener('click', () => setActiveTab(tab.dataset.tab));
});

function updatePricePerSqft() {
    const area = Number(areaInput.value);
    if (!area || area <= 0) {
        pricePerSqft.value = '--';
        return;
    }
    const base = 420;
    const adjusted = Math.round(Math.max(120, Math.min(620, base + (area - 1500) * 0.02)));
    pricePerSqft.value = `$${adjusted}`;
}

if (areaInput) {
    areaInput.addEventListener('input', updatePricePerSqft);
}
updatePricePerSqft();

const amenityChips = document.querySelectorAll('.amenity-chip');
amenityChips.forEach(chip => {
    chip.addEventListener('click', () => {
        const amenity = chip.dataset.amenity;
        chip.classList.toggle('active');
        if (chip.classList.contains('active')) {
            state.selectedAmenities.add(amenity);
        } else {
            state.selectedAmenities.delete(amenity);
        }
    });
});

salesToggle.addEventListener('change', () => {
    marketWeightLabel.textContent = salesToggle.checked ? 'Market weight: high' : 'Market weight: medium';
});

function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    clearTimeout(toast.hideTimeout);
    toast.hideTimeout = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(8px)';
    }, 3200);
}

function markInvalid(input) {
    input.style.borderColor = '#ef4444';
}

function clearInvalid(input) {
    input.style.borderColor = 'rgba(255, 255, 255, 0.10)';
}

function validateSingleForm() {
    const fields = ['location', 'cityArea', 'singleArea', 'livingArea', 'singleBedrooms', 'singleBathrooms', 'singleKitchens', 'balconyCount', 'parkingSpaces', 'yearBuilt', 'floorNumber'];
    let valid = true;
    fields.forEach(id => {
        const element = document.getElementById(id);
        if (!element || !element.value || element.value.trim() === '') {
            markInvalid(element);
            valid = false;
        } else {
            clearInvalid(element);
        }
    });
    // Additional numeric validation for new fields
    const living = Number(document.getElementById('livingArea')?.value || 0);
    if (!living || living < 100) {
        markInvalid(document.getElementById('livingArea'));
        showToast('Living Area must be at least 100 sq ft.', 'error');
        return false;
    }

    const kitchens = Number(document.getElementById('singleKitchens')?.value || -1);
    if (!Number.isInteger(kitchens) || kitchens < 0) {
        markInvalid(document.getElementById('singleKitchens'));
        showToast('Number of kitchens must be a non-negative integer.', 'error');
        return false;
    }

    const balcony = Number(document.getElementById('balconyCount')?.value || -1);
    if (!Number.isInteger(balcony) || balcony < 0) {
        markInvalid(document.getElementById('balconyCount'));
        showToast('Balcony count must be a non-negative integer.', 'error');
        return false;
    }

    const parking = Number(document.getElementById('parkingSpaces')?.value || -1);
    if (!Number.isInteger(parking) || parking < 0) {
        markInvalid(document.getElementById('parkingSpaces'));
        showToast('Parking spaces must be a non-negative integer.', 'error');
        return false;
    }

    if (!valid) {
        showToast('Please fill all required fields before predicting.', 'error');
    }
    return valid;
}

function getActiveAmenities() {
    return [...state.selectedAmenities];
}

function setButtonLoading(button, loading) {
    if (!button) return;
    if (loading) {
        button.dataset.originalText = button.innerHTML;
        button.innerHTML = '⏳ Loading...';
        button.disabled = true;
    } else {
        button.innerHTML = button.dataset.originalText || button.innerHTML;
        button.disabled = false;
    }
}

function renderTrendChart(values) {
    trendBars.forEach((bar, index) => {
        const val = values[index] || 0;
        bar.style.height = `${Math.max(18, Math.min(100, val))}%`;
        bar.querySelector('span').textContent = bar.querySelector('span').textContent || bar.querySelector('span').textContent;
        if (index === values.length - 1) {
            bar.classList.add('latest');
        } else {
            bar.classList.remove('latest');
        }
    });
}

function renderSimilarProperties(items) {
    const container = document.getElementById('similarList');
    if (!container) return;
    container.innerHTML = '';
    items.forEach(item => {
        const row = document.createElement('div');
        row.className = 'similar-row';
        row.innerHTML = `
            <div class="similar-icon">🏡</div>
            <div class="similar-meta">
                <strong>${item.name}</strong>
                <span>${item.beds} BR • ${item.baths} BA • ${item.area} sqft • ${item.type}</span>
            </div>
            <div class="similar-price">$${item.price.toLocaleString()}</div>
        `;
        row.addEventListener('click', () => showToast(`${item.name} selected for details`, 'success'));
        container.appendChild(row);
    });
}

function renderAdvisorAdvice(advice) {
    if (!advisorCard) return;

    const explanation = document.getElementById('advisorExplanation');
    const buy = document.getElementById('advisorBuy');
    const sell = document.getElementById('advisorSell');
    const investment = document.getElementById('advisorInvestment');
    const factors = document.getElementById('advisorFactors');

    if (!advice) {
        advisorCard.classList.add('hidden');
        advisorCard.classList.remove('visible');
        return;
    }

    if (advice.available === false) {
        if (explanation) explanation.textContent = 'AI Property Advisor is unavailable at the moment.';
        if (buy) buy.textContent = 'Please configure the Gemini API key in .env to enable advisory insights.';
        if (sell) sell.textContent = '';
        if (investment) investment.textContent = '';
        if (factors) factors.innerHTML = '<li>Gemini key missing or API call failed.</li>';
        if (advisorNote) advisorNote.textContent = advice.message || 'AI advisor note unavailable.';
        advisorCard.classList.remove('hidden');
        advisorCard.classList.add('visible');
        return;
    }

    if (explanation) explanation.textContent = advice.explanation || 'No explanation returned from Gemini.';
    if (buy) buy.textContent = advice.buy_recommendation || 'No buying recommendation available.';
    if (sell) sell.textContent = advice.sell_recommendation || 'No selling recommendation available.';
    if (investment) investment.textContent = advice.investment_analysis || 'No investment details available.';

    if (factors) {
        factors.innerHTML = '';
        const items = Array.isArray(advice.key_factors) ? advice.key_factors : [advice.key_factors || 'Key factors not provided.'];
        items.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            factors.appendChild(li);
        });
    }

    if (advisorNote) {
        advisorNote.textContent = '';
    }
    advisorCard.classList.remove('hidden');
    advisorCard.classList.add('visible');
}

function hideAdvisor() {
    if (!advisorCard) return;
    advisorCard.classList.add('hidden');
    advisorCard.classList.remove('visible');
}

function updateStats(data) {
    document.getElementById('ppsqft').textContent = `$${data.price_per_sqft}`;
    document.getElementById('yoyGrowth').textContent = `${data.yoy_growth}%`;
    document.getElementById('avgSell').textContent = `${data.avg_sell_days} days`;
    document.getElementById('investScore').textContent = `${data.invest_score}/10`;
    document.getElementById('confidenceValue').textContent = `${data.confidence}%`;
    document.getElementById('confidenceFill').style.width = `${data.confidence}%`;
    document.getElementById('priceValue').textContent = `$${data.predicted_price.toLocaleString()}`;
    document.getElementById('priceRange').textContent = `Range: $${data.price_range[0].toLocaleString()} – $${data.price_range[1].toLocaleString()}`;
}
/* =========================================================
   PREMIUM PROPERTY INSIGHTS
   ========================================================= */

function injectPremiumStyles() {
    if (document.getElementById('premium-feature-styles')) return;

    const style = document.createElement('style');
    style.id = 'premium-feature-styles';

    style.textContent = `
        .premium-features {
            margin-top: 24px;
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 18px;
        }

        .premium-card {
            background: linear-gradient(
                145deg,
                rgba(20, 30, 52, 0.96),
                rgba(14, 22, 40, 0.96)
            );
            border: 1px solid rgba(255,255,255,0.09);
            border-radius: 22px;
            padding: 22px;
            box-shadow: 0 15px 40px rgba(0,0,0,0.20);
            transition: transform .25s ease, border-color .25s ease;
        }

        .premium-card:hover {
            transform: translateY(-4px);
            border-color: rgba(255,255,255,0.18);
        }

        .premium-card.full-width {
            grid-column: 1 / -1;
        }

        .premium-card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 18px;
        }

        .premium-title {
            font-size: 18px;
            font-weight: 700;
            color: #f8fafc;
        }

        .premium-subtitle {
            font-size: 12px;
            color: #94a3b8;
            margin-top: 4px;
        }

        .score-circle {
            width: 82px;
            height: 82px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            background:
                radial-gradient(circle at center,
                #111827 55%,
                transparent 56%),
                conic-gradient(
                    #22c55e var(--score),
                    rgba(255,255,255,.08) 0
                );
        }

        .score-number {
            font-size: 22px;
            font-weight: 800;
            color: white;
        }

        .score-label {
            font-size: 9px;
            color: #94a3b8;
        }

        .factor-row {
            margin: 13px 0;
        }

        .factor-top {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
            color: #cbd5e1;
            margin-bottom: 7px;
        }

        .factor-bar {
            width: 100%;
            height: 7px;
            border-radius: 20px;
            background: rgba(255,255,255,.08);
            overflow: hidden;
        }

        .factor-fill {
            height: 100%;
            border-radius: inherit;
            background: linear-gradient(90deg,#38bdf8,#818cf8);
            transition: width .8s ease;
        }

        .forecast-grid {
            display: grid;
            grid-template-columns: repeat(5,1fr);
            gap: 10px;
        }

        .forecast-item {
            padding: 14px 8px;
            border-radius: 14px;
            background: rgba(255,255,255,.045);
            text-align: center;
        }

        .forecast-year {
            font-size: 11px;
            color: #94a3b8;
            margin-bottom: 8px;
        }

        .forecast-price {
            font-size: 14px;
            font-weight: 700;
            color: #f8fafc;
        }

        .emi-box {
            display: grid;
            grid-template-columns: repeat(3,1fr);
            gap: 12px;
        }

        .emi-value {
            background: rgba(255,255,255,.045);
            padding: 16px;
            border-radius: 15px;
        }

        .emi-label {
            color: #94a3b8;
            font-size: 11px;
            margin-bottom: 6px;
        }

        .emi-number {
            color: #f8fafc;
            font-size: 17px;
            font-weight: 700;
        }

        .health-score {
            font-size: 38px;
            font-weight: 800;
            color: #22c55e;
        }

        .health-status {
            font-size: 13px;
            color: #94a3b8;
        }

        @media(max-width: 700px) {
            .premium-features {
                grid-template-columns: 1fr;
            }

            .premium-card.full-width {
                grid-column: auto;
            }

            .forecast-grid {
                grid-template-columns: repeat(2,1fr);
            }

            .emi-box {
                grid-template-columns: 1fr;
            }
        }
    `;

    document.head.appendChild(style);
}


/* ---------------------------------------------------------
   CREATE PREMIUM FEATURE CONTAINER
   --------------------------------------------------------- */

function createPremiumContainer() {

    let container = document.getElementById('premiumFeatures');

    if (container) return container;

    const resultsPanel = document.querySelector('.results-panel');

    if (!resultsPanel) return null;

    container = document.createElement('div');
    container.id = 'premiumFeatures';
    container.className = 'premium-features';

    resultsPanel.appendChild(container);

    return container;
}


/* ---------------------------------------------------------
   1. AI DEAL SCORE
   --------------------------------------------------------- */

function calculateDealScore(data) {

    const confidence = Number(data.confidence || 0);
    const investment = Number(data.invest_score || 0);

    const price = Number(data.predicted_price || 0);
    const pricePerSqft = Number(data.price_per_sqft || 0);

    let score = 50;

    score += confidence * 0.20;
    score += investment * 2;

    if (pricePerSqft > 0) {

        if (pricePerSqft < 300) {
            score += 12;
        } else if (pricePerSqft < 400) {
            score += 8;
        } else if (pricePerSqft < 500) {
            score += 3;
        } else {
            score -= 5;
        }
    }

    return Math.max(0, Math.min(100, Math.round(score)));
}


function renderDealScore(data) {

    const score = calculateDealScore(data);

    return `
        <div class="premium-card">

            <div class="premium-card-header">

                <div>
                    <div class="premium-title">
                        🏆 AI Deal Score
                    </div>

                    <div class="premium-subtitle">
                        Overall property attractiveness
                    </div>
                </div>

                <div
                    class="score-circle"
                    style="--score:${score}%"
                >
                    <div class="score-number">
                        ${score}
                    </div>

                    <div class="score-label">
                        / 100
                    </div>
                </div>

            </div>

            <div style="
                color:#94a3b8;
                font-size:13px;
                line-height:1.6;
            ">
                ${score >= 80
                    ? '🔥 Excellent opportunity based on the available property indicators.'
                    : score >= 65
                    ? '✨ Good property with several positive indicators.'
                    : '⚠️ Review the property factors carefully before making a decision.'
                }
            </div>

        </div>
    `;
}


/* ---------------------------------------------------------
   2. WHY THIS PRICE?
   --------------------------------------------------------- */

function renderPriceFactors(data) {

    const confidence = Number(data.confidence || 0);
    const investment = Number(data.invest_score || 0) * 10;

    const growth = Number(data.yoy_growth || 0);

    const growthScore = Math.max(
        20,
        Math.min(100, 50 + growth * 8)
    );

    const factors = [
        {
            name: 'Model Confidence',
            value: confidence
        },
        {
            name: 'Investment Potential',
            value: investment
        },
        {
            name: 'Market Growth',
            value: growthScore
        }
    ];

    return `
        <div class="premium-card">

            <div class="premium-title">
                🔍 Why This Price?
            </div>

            <div class="premium-subtitle">
                Key factors influencing the valuation
            </div>

            <div style="margin-top:18px">

                ${factors.map(f => `
                    <div class="factor-row">

                        <div class="factor-top">
                            <span>${f.name}</span>
                            <span>${Math.round(f.value)}%</span>
                        </div>

                        <div class="factor-bar">
                            <div
                                class="factor-fill"
                                style="width:${Math.min(100,f.value)}%"
                            ></div>
                        </div>

                    </div>
                `).join('')}

            </div>

        </div>
    `;
}


/* ---------------------------------------------------------
   3. FIVE YEAR FORECAST
   --------------------------------------------------------- */

function renderFiveYearForecast(data) {

    const price = Number(data.predicted_price || 0);

    let growth = Number(data.yoy_growth || 3.6);

    // Keep forecast reasonable
    growth = Math.max(1, Math.min(15, growth));

    let forecast = [];

    for (let year = 1; year <= 5; year++) {

        const futurePrice =
            price * Math.pow(1 + growth / 100, year);

        forecast.push({
            year: year,
            price: Math.round(futurePrice)
        });
    }

    return `
        <div class="premium-card full-width">

            <div class="premium-card-header">

                <div>

                    <div class="premium-title">
                        📈 5-Year Property Forecast
                    </div>

                    <div class="premium-subtitle">
                        Estimated value using current YoY growth
                    </div>

                </div>

                <div style="
                    color:#22c55e;
                    font-weight:700;
                ">
                    +${growth}% / year
                </div>

            </div>

            <div class="forecast-grid">

                ${forecast.map(item => `

                    <div class="forecast-item">

                        <div class="forecast-year">
                            YEAR ${item.year}
                        </div>

                        <div class="forecast-price">
                            $${item.price.toLocaleString()}
                        </div>

                    </div>

                `).join('')}

            </div>

        </div>
    `;
}


/* ---------------------------------------------------------
   4. EMI CALCULATOR
   --------------------------------------------------------- */

function calculateEMI(price) {

    const downPayment = price * 0.20;

    const loan = price - downPayment;

    const annualRate = 8.5;

    const monthlyRate = annualRate / 12 / 100;

    const months = 20 * 12;

    const emi =
        loan *
        monthlyRate *
        Math.pow(1 + monthlyRate, months) /
        (Math.pow(1 + monthlyRate, months) - 1);

    return {
        downPayment,
        loan,
        emi
    };
}


function renderEMICalculator(data) {

    const price = Number(data.predicted_price || 0);

    const emiData = calculateEMI(price);

    return `
        <div class="premium-card full-width">

            <div class="premium-title">
                💰 Affordability Snapshot
            </div>

            <div class="premium-subtitle">
                Example financing estimate · 20% down payment · 8.5% interest
            </div>

            <div class="emi-box" style="margin-top:18px">

                <div class="emi-value">

                    <div class="emi-label">
                        DOWN PAYMENT
                    </div>

                    <div class="emi-number">
                        $${Math.round(
                            emiData.downPayment
                        ).toLocaleString()}
                    </div>

                </div>

                <div class="emi-value">

                    <div class="emi-label">
                        LOAN AMOUNT
                    </div>

                    <div class="emi-number">
                        $${Math.round(
                            emiData.loan
                        ).toLocaleString()}
                    </div>

                </div>

                <div class="emi-value">

                    <div class="emi-label">
                        EST. MONTHLY EMI
                    </div>

                    <div class="emi-number">
                        $${Math.round(
                            emiData.emi
                        ).toLocaleString()}
                    </div>

                </div>

            </div>

        </div>
    `;
}


/* ---------------------------------------------------------
   5. PROPERTY HEALTH SCORE
   --------------------------------------------------------- */

function calculatePropertyHealth(data) {

    let score = 50;

    const area = Number(data.area || 0);
    const livingArea = Number(data.living_area || 0);
    const bedrooms = Number(data.bedrooms || 0);
    const bathrooms = Number(data.bathrooms || 0);
    const parking = Number(data.parking_spaces || 0);
    const amenities = Number(data.amenities?.length || 0);

    const yearBuilt = Number(
        document.getElementById('yearBuilt')?.value || 2015
    );

    const age = new Date().getFullYear() - yearBuilt;

    if (area >= 1200) score += 8;
    if (livingArea >= 900) score += 8;
    if (bedrooms >= 2) score += 5;
    if (bathrooms >= 2) score += 5;
    if (parking >= 1) score += 6;
    if (amenities >= 3) score += 6;

    if (age <= 10) score += 8;
    else if (age > 30) score -= 8;

    return Math.max(0, Math.min(100, score));
}


function renderPropertyHealth(data) {

    const score = calculatePropertyHealth(data);

    let status;

    if (score >= 80) {
        status = 'Excellent property profile';
    } else if (score >= 65) {
        status = 'Healthy property profile';
    } else {
        status = 'Needs further evaluation';
    }

    return `
        <div class="premium-card">

            <div class="premium-title">
                🏡 Property Health
            </div>

            <div class="premium-subtitle">
                Based on property characteristics
            </div>

            <div style="margin-top:16px">

                <div class="health-score">
                    ${score}
                    <span style="
                        font-size:15px;
                        color:#94a3b8;
                    ">
                        /100
                    </span>
                </div>

                <div class="health-status">
                    ${status}
                </div>

            </div>

        </div>
    `;
}


/* ---------------------------------------------------------
   RENDER ALL PREMIUM FEATURES
   --------------------------------------------------------- */

function renderPremiumFeatures(data) {

    injectPremiumStyles();

    const container = createPremiumContainer();

    if (!container) return;

    container.innerHTML = `

        ${renderDealScore(data)}

        ${renderPropertyHealth(data)}

        ${renderPriceFactors(data)}

        ${renderFiveYearForecast(data)}

        ${renderEMICalculator(data)}

    `;
}

function showResultsPanel() {
    const resultsPanel = document.querySelector('.results-panel');
    resultsPanel?.classList.add('has-data');
}

function animatePrice(target) {
    const amount = document.getElementById('priceValue');
    if (!amount) return;
    let current = 0;
    const step = Math.max(20, Math.round(target / 40));
    const interval = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(interval);
        }
        amount.textContent = '$' + current.toLocaleString();
    }, 16);
}

function handlePredict(event) {
    event.preventDefault();
    if (!validateSingleForm()) return;

    hideAdvisor();
    const button = document.getElementById('predictSubmit');
    setButtonLoading(button, true);

    const payload = {
        location: document.getElementById('location').value,
        city: document.getElementById('cityArea').value,
        area: Number(document.getElementById('singleArea').value),
        living_area: Number(document.getElementById('livingArea').value),
        bedrooms: Number(document.getElementById('singleBedrooms').value),
        bathrooms: Number(document.getElementById('singleBathrooms').value),
        kitchens: Number(document.getElementById('singleKitchens').value),
        year_built: Number(document.getElementById('yearBuilt').value),
        floor: Number(document.getElementById('floorNumber').value),
        balcony_count: Number(document.getElementById('balconyCount').value),
        parking_spaces: Number(document.getElementById('parkingSpaces').value),
        amenities: getActiveAmenities(),
        include_nearby: salesToggle.checked
    };

    fetch('/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        setButtonLoading(button, false);
        if (data.error) {
            showToast(data.error || 'Prediction failed. Please try again.', 'error');
            return;
        }

        updateStats(data);
        renderTrendChart(data.trend);
        renderSimilarProperties(data.similar);
        renderAdvisorAdvice(data.ai_advice);
        animatePrice(data.predicted_price);
        showResultsPanel();
        renderPremiumFeatures(data);
    })
    .catch(() => {
        setButtonLoading(button, false);
        showToast('Prediction failed. Please try again.', 'error');
    });
}

const predictForm = document.getElementById('predictForm');
predictForm?.addEventListener('submit', handlePredict);

compareSubmit?.addEventListener('click', (event) => {
    event.preventDefault();
    const aArea = Number(document.getElementById('compareAreaA').value);
    const aBeds = Number(document.getElementById('compareBedsA').value);
    const bArea = Number(document.getElementById('compareAreaB').value);
    const bBeds = Number(document.getElementById('compareBedsB').value);
    const compareButton = document.getElementById('compareSubmit');

    if (!aArea || !aBeds || !bArea || !bBeds) {
        showToast('Fill both compare forms to continue.', 'error');
        return;
    }
    setButtonLoading(compareButton, true);

    fetch('/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            propertyA: { area: aArea, bedrooms: aBeds },
            propertyB: { area: bArea, bedrooms: bBeds }
        })
    })
    .then(response => response.json())
    .then(data => {
        setButtonLoading(compareButton, false);
        if (data.error) {
            showToast(data.error || 'Compare failed. Please try again.', 'error');
            return;
        }
        showToast(data.summary, 'success');
        document.getElementById('comparisonResult').innerHTML = `
            <div class="compare-row"><strong>Property A:</strong> $${data.propertyA_price.toLocaleString()}</div>
            <div class="compare-row"><strong>Property B:</strong> $${data.propertyB_price.toLocaleString()}</div>
        `;
    })
    .catch(() => {
        setButtonLoading(compareButton, false);
        showToast('Compare failed. Please try again.', 'error');
    });
});

marketSubmit?.addEventListener('click', (event) => {
    event.preventDefault();
    const cityValue = document.getElementById('marketCity').value.trim();
    if (!cityValue) {
        showToast('Enter a city or pin code.', 'error');
        return;
    }
    const marketButton = document.getElementById('marketSubmit');
    setButtonLoading(marketButton, true);

    fetch(`/market?city=${encodeURIComponent(cityValue)}`)
    .then(response => response.json())
    .then(data => {
        setButtonLoading(marketButton, false);
        if (data.error) {
            showToast(data.error || 'Market analysis failed. Please try again.', 'error');
            return;
        }
        document.getElementById('marketCityLabel').textContent = `Market analysis for ${data.city}`;
        document.getElementById('marketAvgPrice').textContent = `$${data.avg_price.toLocaleString()}`;
        document.getElementById('marketDemand').textContent = `${data.demand_index}% demand`;
        document.getElementById('marketTrend').textContent = `${data.price_trend}`;
        document.getElementById('marketLocalities').textContent = data.top_localities.join(', ');
        document.getElementById('marketAnalysisCard').classList.remove('hidden');
    })
    .catch(() => {
        setButtonLoading(marketButton, false);
        showToast('Market analysis failed. Please try again.', 'error');
    });
});

let liveReloadState = null;

function checkLiveReload() {
    fetch('/_live_reload')
        .then(response => response.json())
        .then(data => {
            if (liveReloadState) {
                const oldKeys = Object.keys(liveReloadState);
                for (const key of oldKeys) {
                    if (data[key] !== liveReloadState[key]) {
                        window.location.reload();
                        return;
                    }
                }
            }
            liveReloadState = data;
        })
        .catch(() => {
            // ignore errors while backend may be restarting
        });
}

setInterval(checkLiveReload, 2000);
checkLiveReload();

setActiveTab('single');
