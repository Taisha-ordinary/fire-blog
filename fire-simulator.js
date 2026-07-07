(function () {
  "use strict";

  // ブログ実測データ（記事群から）を初期値の目安として使用。ユーザーは全項目編集可能。
  // 参照：kanazawa-rent-market.html（家賃）、kanazawa-living-cost.html（生活費）、
  //       moving-cost-breakdown.html（引っ越し費用）、side-hustle-remote-worker-kanazawa.html（車関連）
  const DEFAULTS = {
    tokyo: {
      rent: 200000,
      livingCost: 120000,
      hasCar: false,
      carCost: 0,
      kids: 0,
      eduCostPerKid: 30000,
      assets: 4000,
      monthlySavings: 150000,
    },
    local: {
      rent: 80000,
      livingCost: 100000,
      hasCar: true,
      carCost: 25000,
      kids: 0,
      eduCostPerKid: 20000,
      movingCost: 500000,
    },
    common: {
      fireTarget: 6000,
      inflationRate: 2.0,
      returnRate: 4.0,
      years: 30,
    },
  };

  function yen(n) {
    return Math.round(n).toLocaleString("ja-JP");
  }
  function man(n) {
    return (n / 10000).toLocaleString("ja-JP", { maximumFractionDigits: 0 });
  }

  function readScenario(prefix) {
    const g = (id) => document.getElementById(prefix + "-" + id);
    const hasCar = g("hascar-yes").classList.contains("is-active");
    return {
      rent: Number(g("rent").value) || 0,
      livingCost: Number(g("living").value) || 0,
      hasCar: hasCar,
      carCost: hasCar ? Number(g("carcost").value) || 0 : 0,
      kids: Number(g("kids").value) || 0,
      eduCostPerKid: Number(g("edu").value) || 0,
      movingCost: prefix === "local" ? Number(g("moving").value) || 0 : 0,
    };
  }

  // 年ごとに支出をインフレ調整しながら、資産推移をシミュレーションする。
  // 簡易モデル：世帯の手取り収入は一定と仮定し、「基準の毎月貯蓄額」に
  // 都内/地方の支出差額を加減算した額を、その年の実効貯蓄額とする。
  function simulate(scenario, common, baseMonthlySavings, baselineExpense) {
    const monthlyExpense =
      scenario.rent + scenario.livingCost + scenario.carCost + scenario.kids * scenario.eduCostPerKid;
    const inflation = common.inflationRate / 100;
    const returnRate = common.returnRate / 100;
    let assets = common.startAssets * 10000 - (scenario.movingCost || 0);
    const path = [{ year: 0, assets: assets }];
    let yearsToTarget = null;
    const target = common.fireTarget * 10000;

    if (assets >= target) yearsToTarget = 0;

    for (let year = 1; year <= common.years; year++) {
      const inflatedExpense = monthlyExpense * Math.pow(1 + inflation, year - 1);
      const expenseDiff = inflatedExpense - baselineExpense * Math.pow(1 + inflation, year - 1);
      const effectiveMonthlySavings = baseMonthlySavings - expenseDiff;
      const annualSavings = effectiveMonthlySavings * 12;
      assets = assets * (1 + returnRate) + annualSavings;
      path.push({ year: year, assets: assets });
      if (yearsToTarget === null && assets >= target) {
        yearsToTarget = year;
      }
    }
    return { path: path, yearsToTarget: yearsToTarget, monthlyExpense: monthlyExpense };
  }

  function setupToggle(prefix) {
    const yesBtn = document.getElementById(prefix + "-hascar-yes");
    const noBtn = document.getElementById(prefix + "-hascar-no");
    const costField = document.getElementById(prefix + "-carcost-field");
    function set(hasCar) {
      yesBtn.classList.toggle("is-active", hasCar);
      noBtn.classList.toggle("is-active", !hasCar);
      costField.style.display = hasCar ? "block" : "none";
    }
    yesBtn.addEventListener("click", () => set(true));
    noBtn.addEventListener("click", () => set(false));
    return set;
  }

  function drawChart(tokyoPath, localPath, years, target) {
    const svg = document.getElementById("sim-chart-svg");
    const W = 640, H = 280, padL = 50, padR = 16, padT = 16, padB = 30;
    const maxAssets = Math.max(
      target,
      ...tokyoPath.map((p) => p.assets),
      ...localPath.map((p) => p.assets)
    ) * 1.05;
    const x = (year) => padL + (year / years) * (W - padL - padR);
    const y = (val) => H - padB - (Math.max(val, 0) / maxAssets) * (H - padT - padB);

    function toPoints(path) {
      return path.map((p) => x(p.year) + "," + y(p.assets)).join(" ");
    }

    const targetY = y(target);
    let svgContent = "";
    svgContent += `<line x1="${padL}" y1="${targetY}" x2="${W - padR}" y2="${targetY}" stroke="#b8912f" stroke-width="1.4" stroke-dasharray="4 4" />`;
    svgContent += `<text x="${W - padR}" y="${targetY - 6}" text-anchor="end" font-size="11" fill="#8f6f22" font-family="JetBrains Mono, monospace">FIRE目標</text>`;
    svgContent += `<polyline points="${toPoints(tokyoPath)}" fill="none" stroke="#57606a" stroke-width="2.6" />`;
    svgContent += `<polyline points="${toPoints(localPath)}" fill="none" stroke="#b8912f" stroke-width="2.6" />`;
    svgContent += `<line x1="${padL}" y1="${H - padB}" x2="${W - padR}" y2="${H - padB}" stroke="#e7e5df" stroke-width="1" />`;
    for (let yr = 0; yr <= years; yr += Math.ceil(years / 6)) {
      svgContent += `<text x="${x(yr)}" y="${H - padB + 18}" text-anchor="middle" font-size="10" fill="#57606a" font-family="JetBrains Mono, monospace">${yr}年後</text>`;
    }
    svg.innerHTML = svgContent;
  }

  function run() {
    const tokyo = readScenario("tokyo");
    const local = readScenario("local");
    const common = {
      fireTarget: Number(document.getElementById("common-target").value) || 0,
      inflationRate: Number(document.getElementById("common-inflation").value) || 0,
      returnRate: Number(document.getElementById("common-return").value) || 0,
      years: Number(document.getElementById("common-years").value) || 30,
      startAssets: Number(document.getElementById("common-assets").value) || 0,
    };
    const baseMonthlySavings = Number(document.getElementById("common-savings").value) || 0;

    const tokyoExpense = tokyo.rent + tokyo.livingCost + tokyo.carCost + tokyo.kids * tokyo.eduCostPerKid;

    const tokyoResult = simulate(tokyo, common, baseMonthlySavings, tokyoExpense);
    const localResult = simulate(local, common, baseMonthlySavings, tokyoExpense);

    document.getElementById("sim-results").style.display = "block";

    const fmtYears = (y) => (y === null ? common.years + "年以内に到達せず" : y + "年後");
    document.getElementById("result-tokyo-years").textContent = fmtYears(tokyoResult.yearsToTarget);
    document.getElementById("result-local-years").textContent = fmtYears(localResult.yearsToTarget);
    document.getElementById("result-tokyo-expense").textContent = yen(tokyoResult.monthlyExpense) + "円";
    document.getElementById("result-local-expense").textContent = yen(localResult.monthlyExpense) + "円";

    if (tokyoResult.yearsToTarget !== null && localResult.yearsToTarget !== null) {
      const diff = tokyoResult.yearsToTarget - localResult.yearsToTarget;
      const diffEl = document.getElementById("sim-diff-text");
      if (diff > 0) {
        diffEl.innerHTML = `地方移住シナリオの方が <strong>${diff}年早く</strong> FIRE目標に到達する計算です`;
      } else if (diff < 0) {
        diffEl.innerHTML = `このシナリオでは、都内在住の方が ${Math.abs(diff)}年早い計算になりました`;
      } else {
        diffEl.textContent = "両シナリオでFIRE到達年数は同じ計算になりました";
      }
    } else {
      document.getElementById("sim-diff-text").textContent =
        "設定した期間内にFIRE目標へ到達しない試算です。貯蓄額・利回り・目標額を調整してみてください";
    }

    drawChart(tokyoResult.path, localResult.path, common.years, common.fireTarget * 10000);
    const resultsEl = document.getElementById("sim-results");
    if (typeof resultsEl.scrollIntoView === "function") {
      resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function fillDefaults() {
    document.getElementById("tokyo-rent").value = DEFAULTS.tokyo.rent;
    document.getElementById("tokyo-living").value = DEFAULTS.tokyo.livingCost;
    document.getElementById("tokyo-kids").value = DEFAULTS.tokyo.kids;
    document.getElementById("tokyo-edu").value = DEFAULTS.tokyo.eduCostPerKid;
    document.getElementById("tokyo-carcost").value = DEFAULTS.tokyo.carCost;

    document.getElementById("local-rent").value = DEFAULTS.local.rent;
    document.getElementById("local-living").value = DEFAULTS.local.livingCost;
    document.getElementById("local-kids").value = DEFAULTS.local.kids;
    document.getElementById("local-edu").value = DEFAULTS.local.eduCostPerKid;
    document.getElementById("local-carcost").value = DEFAULTS.local.carCost;
    document.getElementById("local-moving").value = DEFAULTS.local.movingCost;

    document.getElementById("common-assets").value = DEFAULTS.tokyo.assets;
    document.getElementById("common-savings").value = DEFAULTS.tokyo.monthlySavings;
    document.getElementById("common-target").value = DEFAULTS.common.fireTarget;
    document.getElementById("common-inflation").value = DEFAULTS.common.inflationRate;
    document.getElementById("common-return").value = DEFAULTS.common.returnRate;
    document.getElementById("common-years").value = DEFAULTS.common.years;
  }

  document.addEventListener("DOMContentLoaded", function () {
    fillDefaults();
    const setTokyoCar = setupToggle("tokyo");
    const setLocalCar = setupToggle("local");
    setTokyoCar(DEFAULTS.tokyo.hasCar);
    setLocalCar(DEFAULTS.local.hasCar);
    document.getElementById("sim-run").addEventListener("click", run);
  });
})();
