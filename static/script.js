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
