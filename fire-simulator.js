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
      // 世帯の手取り月収は移住しても変わらない前提（フルリモート等で同一収入を維持するケースを想定）。
      // 旧実装は「都内シナリオの貯蓄額」を起点に地方シナリオとの支出差分だけを加減算しており、
      // 都内シナリオ自身の貯蓄額がインフレの影響を受けない・地方シナリオとの差分が画面上どこにも
      // 表示されないという2つの問題があった。手取り月収を唯一の共通入力にし、各シナリオの
      // 実効貯蓄額（＝月収−その年のインフレ後支出）を両シナリオ対称に計算・表示する。
      householdIncome: 470000,
    },
  };

  function yen(n) {
    return Math.round(n).toLocaleString("ja-JP");
  }
  function man(n) {
    return (n / 10000).toLocaleString("ja-JP", { maximumFractionDigits: 0 });
  }

  // 家賃・生活費・車の維持費・教育費・引っ越し費用はマイナス入力を許容しない
  // （0円未満の家賃等はあり得ず、そのまま計算すると「不自然に支出が少ない/収入化する」結果になるため）。
  function nonNegative(value) {
    const n = Number(value);
    if (!isFinite(n) || n < 0) return 0;
    return n;
  }

  function readScenario(prefix) {
    const g = (id) => document.getElementById(prefix + "-" + id);
    const hasCar = g("hascar-yes").classList.contains("is-active");
    return {
      rent: nonNegative(g("rent").value),
      livingCost: nonNegative(g("living").value),
      hasCar: hasCar,
      carCost: hasCar ? nonNegative(g("carcost").value) : 0,
      kids: Math.max(0, Math.floor(Number(g("kids").value) || 0)),
      eduCostPerKid: nonNegative(g("edu").value),
      movingCost: prefix === "local" ? nonNegative(g("moving").value) : 0,
    };
  }

  // 年ごとに支出をインフレ調整しながら、資産推移をシミュレーションする。
  // 簡易モデル：世帯の手取り月収（householdIncome）は移住の有無・年数によらず一定と仮定し、
  // 各年の実効貯蓄額＝手取り月収−その年のインフレ後支出、を両シナリオ対称に計算する。
  // 支出（家賃・生活費・車・教育費）はシナリオごとに異なるため、実効貯蓄額も自然にシナリオ間で分岐する。
  function simulate(scenario, common, householdIncome) {
    const monthlyExpense =
      scenario.rent + scenario.livingCost + scenario.carCost + scenario.kids * scenario.eduCostPerKid;
    const inflation = common.inflationRate / 100;
    const returnRate = common.returnRate / 100;
    let assets = common.startAssets * 10000 - (scenario.movingCost || 0);
    const path = [{ year: 0, assets: assets }];
    let yearsToTarget = null;
    const target = common.fireTarget * 10000;
    const firstYearMonthlySavings = householdIncome - monthlyExpense;

    if (assets >= target) yearsToTarget = 0;

    for (let year = 1; year <= common.years; year++) {
      const inflatedExpense = monthlyExpense * Math.pow(1 + inflation, year - 1);
      const effectiveMonthlySavings = householdIncome - inflatedExpense;
      const annualSavings = effectiveMonthlySavings * 12;
      assets = assets * (1 + returnRate) + annualSavings;
      path.push({ year: year, assets: assets });
      if (yearsToTarget === null && assets >= target) {
        yearsToTarget = year;
      }
    }
    return {
      path: path,
      yearsToTarget: yearsToTarget,
      monthlyExpense: monthlyExpense,
      firstYearMonthlySavings: firstYearMonthlySavings,
    };
  }

  function setupToggle(prefix) {
    const yesBtn = document.getElementById(prefix + "-hascar-yes");
    const noBtn = document.getElementById(prefix + "-hascar-no");
    const costField = document.getElementById(prefix + "-carcost-field");
    function set(hasCar) {
      yesBtn.classList.toggle("is-active", hasCar);
      noBtn.classList.toggle("is-active", !hasCar);
      yesBtn.setAttribute("aria-pressed", hasCar ? "true" : "false");
      noBtn.setAttribute("aria-pressed", hasCar ? "false" : "true");
      costField.style.display = hasCar ? "block" : "none";
    }
    yesBtn.addEventListener("click", () => set(true));
    noBtn.addEventListener("click", () => set(false));
    return set;
  }

  function drawChart(tokyoPath, localPath, years, target) {
    const svg = document.getElementById("sim-chart-svg");
    const W = 640, H = 280, padL = 82, padR = 16, padT = 16, padB = 30;
    // target・資産推移がすべて0（＝全入力欄を0にした場合など）だと maxAssets が0になり、
    // 0除算でグラフの座標がNaNになって非表示になってしまうため、最低値を1円で下支えする。
    const rawMaxAssets = Math.max(
      target,
      ...tokyoPath.map((p) => p.assets),
      ...localPath.map((p) => p.assets)
    );
    const maxAssets = Math.max(rawMaxAssets, 1) * 1.05;
    // years が想定外に0以下（通常は起こらないが念のため）でも0除算を避ける。
    const safeYears = years > 0 ? years : 1;
    const x = (year) => padL + (year / safeYears) * (W - padL - padR);
    const y = (val) => H - padB - (Math.max(val, 0) / maxAssets) * (H - padT - padB);

    function toPoints(path) {
      return path.map((p) => x(p.year) + "," + y(p.assets)).join(" ");
    }

    const targetY = y(target);
    let svgContent = "";

    // Y軸（左側）：資産額のグリッド線とラベル。何年後にいくらになるかを直感的に読み取れるようにする。
    const yStepsCount = 4;
    for (let i = 0; i <= yStepsCount; i++) {
      const val = (maxAssets / yStepsCount) * i;
      const yy = y(val);
      svgContent += `<line x1="${padL}" y1="${yy}" x2="${W - padR}" y2="${yy}" stroke="#e7e5df" stroke-width="1" />`;
      svgContent += `<text x="${padL - 8}" y="${yy + 4}" text-anchor="end" font-size="11" fill="#57606a" font-family="JetBrains Mono, monospace">${man(val)}万円</text>`;
    }

    svgContent += `<line x1="${padL}" y1="${targetY}" x2="${W - padR}" y2="${targetY}" stroke="#b8912f" stroke-width="1.4" stroke-dasharray="4 4" />`;
    svgContent += `<text x="${W - padR}" y="${targetY - 6}" text-anchor="end" font-size="13" fill="#8f6f22" font-family="JetBrains Mono, monospace">FIRE目標</text>`;
    svgContent += `<polyline points="${toPoints(tokyoPath)}" fill="none" stroke="#57606a" stroke-width="2.6" />`;
    svgContent += `<polyline points="${toPoints(localPath)}" fill="none" stroke="#b8912f" stroke-width="2.6" />`;
    svgContent += `<line x1="${padL}" y1="${H - padB}" x2="${W - padR}" y2="${H - padB}" stroke="#e7e5df" stroke-width="1" />`;
    const yStep = Math.ceil(safeYears / 6);
    for (let yr = 0; yr <= safeYears; yr += yStep) {
      svgContent += `<text x="${x(yr)}" y="${H - padB + 18}" text-anchor="middle" font-size="12" fill="#57606a" font-family="JetBrains Mono, monospace">${yr}年後</text>`;
    }
    svg.innerHTML = svgContent;
  }

  // GA4トラッキング：入力された資産額・生活費・家賃・年収・子どもの人数などの生の値は一切送らない。
  // 送るのは「どちらが速いか」「何年区分か」という分類のみ。
  function yearBucket(years) {
    if (years === null || years === undefined) return "not_reached";
    if (years <= 5) return "0_5_years";
    if (years <= 10) return "5_10_years";
    if (years <= 20) return "10_20_years";
    if (years <= 30) return "20_30_years";
    return "over_30_years";
  }

  function trackSimulatorRun(tokyoYears, localYears) {
    let resultType;
    let winningYears;
    if (tokyoYears === null && localYears === null) {
      resultType = "unknown";
      winningYears = null;
    } else if (localYears === null) {
      resultType = "tokyo_faster";
      winningYears = tokyoYears;
    } else if (tokyoYears === null) {
      resultType = "local_faster";
      winningYears = localYears;
    } else if (localYears < tokyoYears) {
      resultType = "local_faster";
      winningYears = localYears;
    } else if (tokyoYears < localYears) {
      resultType = "tokyo_faster";
      winningYears = tokyoYears;
    } else {
      resultType = "same";
      winningYears = tokyoYears;
    }

    window.dataLayer = window.dataLayer || [];
    dataLayer.push({
      event: "fire_simulator_run",
      simulator_type: "relocation_fire",
      scenario_count: 2,
      fire_year_bucket: yearBucket(winningYears),
      result_type: resultType,
    });
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
    const householdIncome = Number(document.getElementById("common-income").value) || 0;

    const tokyoResult = simulate(tokyo, common, householdIncome);
    const localResult = simulate(local, common, householdIncome);

    trackSimulatorRun(tokyoResult.yearsToTarget, localResult.yearsToTarget);

    document.getElementById("sim-results").style.display = "block";

    const fmtYears = (y) => (y === null ? common.years + "年以内に到達せず" : y + "年後");
    document.getElementById("result-tokyo-years").textContent = fmtYears(tokyoResult.yearsToTarget);
    document.getElementById("result-local-years").textContent = fmtYears(localResult.yearsToTarget);
    document.getElementById("result-tokyo-expense").textContent = yen(tokyoResult.monthlyExpense) + "円";
    document.getElementById("result-local-expense").textContent = yen(localResult.monthlyExpense) + "円";
    document.getElementById("result-tokyo-savings").textContent = yen(tokyoResult.firstYearMonthlySavings) + "円";
    document.getElementById("result-local-savings").textContent = yen(localResult.firstYearMonthlySavings) + "円";

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
    document.getElementById("common-income").value = DEFAULTS.common.householdIncome;
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
