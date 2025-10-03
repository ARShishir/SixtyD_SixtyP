// BMI গণনা ফাংশন
function computeBMI(weight, heightCm) {
  const h = heightCm / 100;
  return weight / (h * h);
}

// BMI ক্যাটেগরি নির্ধারণ
function categoryForBMI(bmi) {
  if (bmi < 18.5) return { key: 'under', label: 'নিম্ন ওজন' };
  if (bmi < 25) return { key: 'normal', label: 'স্বাভাবিক' };
  if (bmi < 30) return { key: 'over', label: 'অতিরিক্ত ওজন' };
  return { key: 'obese', label: 'স্থূল' };
}

// চার্ট রেন্ডার করা
function renderChart(container, bmi) {
  container.innerHTML = '';

  const min = 12, max = 40;
  function pctFor(v) {
    return ((Math.max(min, Math.min(max, v)) - min) / (max - min)) * 100;
  }

  // বিভিন্ন রেঞ্জের জন্য রঙ দেখানো
  const ranges = [
    { class: 'r-under', from: min, to: 18.5 },
    { class: 'r-normal', from: 18.5, to: 25 },
    { class: 'r-over', from: 25, to: 30 },
    { class: 'r-obese', from: 30, to: max }
  ];

  ranges.forEach(r => {
    const w = ((Math.min(max, r.to) - Math.max(min, r.from)) / (max - min)) * 100;
    const el = document.createElement('div');
    el.className = 'range ' + r.class;
    el.style.flex = '0 0 ' + w + '%';
    container.appendChild(el);
  });

  // মার্কার বসানো
  if (!isNaN(bmi)) {
    const leftPct = pctFor(bmi);

    const marker = document.createElement('div');
    marker.className = 'marker';

    // PIN (BMI মান)
    const pin = document.createElement('div');
    pin.className = 'pin';
    pin.textContent = bmi.toFixed(1);
    pin.style.left = leftPct + '%';
    pin.style.transform = 'translateX(-50%)'; // ✅ সেন্টারে বসবে
    marker.appendChild(pin);

    // TRIANGLE (Pointer)
    const tri = document.createElement('div');
    tri.className = 'triangle';
    tri.style.left = leftPct + '%';
    tri.style.transform = 'translateX(-50%)'; // ✅ সেন্টারে বসবে
    marker.appendChild(tri);

    container.appendChild(marker);
  }
}

// বয়স, লিঙ্গ ও BMI অনুযায়ী পরামর্শ
function adviceText(age, sex, bmi) {
  const parts = [];
  if (age && age < 20) {
    parts.push('কিশোর বয়সে BMI ভিন্নভাবে গণনা হয়।');
  } else {
    const cat = categoryForBMI(bmi).key;
    if (cat === 'under') parts.push('ওজন বাড়াতে পুষ্টিকর খাবার খান।');
    if (cat === 'normal') parts.push('ভালো আছেন, এভাবে চালিয়ে যান।');
    if (cat === 'over') parts.push('ক্যালোরি কম ও ব্যায়াম জরুরি।');
    if (cat === 'obese') parts.push('ঝুঁকি বেশি — চিকিৎসকের পরামর্শ নিন।');
  }

  if (sex === 'male') parts.push('পুরুষদের ক্ষেত্রে পেশীর কারণে BMI কিছুটা বেশি হতে পারে।');
  if (sex === 'female') parts.push('মহিলাদের শরীরে চর্বি বণ্টন ভিন্ন, BMI একমাত্র সূচক নয়।');

  return parts.join(' ');
}
// Author: Abdur Rahaman Shishir 
// মূল লজিক
(function () {
  const form = document.getElementById('bmiForm');
  const resetBtn = document.getElementById('resetBtn');
  const bmiText = document.getElementById('bmiText');
  const bmiCategory = document.getElementById('bmiCategory');
  const bmiNote = document.getElementById('bmiNote');
  const chart = document.getElementById('bmiChart');
  const adviceEl = document.getElementById('ageSexAdvice');
  const childAdvice = document.getElementById('childAdvice');

  // ফর্ম সাবমিট করলে
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const weight = parseFloat(document.getElementById('weight').value);
    const height = parseFloat(document.getElementById('height').value);
    const ageVal = document.getElementById('age').value;
    const age = ageVal === '' ? null : parseInt(ageVal, 10);
    const sex = document.getElementById('sex').value;

    if (isNaN(weight) || isNaN(height)) {
      bmiText.textContent = 'ত্রুটি: বৈধ মান দিন';
      return;
    }

    const bmi = computeBMI(weight, height);
    const rounded = Math.round(bmi * 100) / 100;

    bmiText.textContent = 'আপনার BMI: ' + rounded.toFixed(2);

    if (age !== null && age < 20) {
      bmiCategory.textContent = 'বয়স <20: আলাদা মূল্যায়ন প্রয়োজন';
      childAdvice.style.display = 'block';
    } else {
      bmiCategory.textContent = categoryForBMI(bmi).label;
      childAdvice.style.display = 'none';
    }

    bmiNote.textContent = 'BMI কেবল নির্দেশক।';
    renderChart(chart, bmi);
    adviceEl.textContent = adviceText(age, sex, bmi);
  });

  // রিসেট করলে
  resetBtn.addEventListener('click', function () {
    form.reset();
    bmiText.textContent = 'আপনার BMI এখানে দেখা যাবে';
    bmiCategory.textContent = '---';
    bmiNote.textContent = 'বিস্তারিত ব্যাখ্যা ও চার্ট নিচে।';
    chart.innerHTML = '';
    adviceEl.textContent = 'যদি আপনার বয়স <20 বছর হয়, BMI ব্যাখ্যা ভিন্ন হতে পারে।';
    childAdvice.style.display = 'none';
  });
})();