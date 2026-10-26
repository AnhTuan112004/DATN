/**
 * SCRIPT HUẤN LUYỆN VÀ ĐÁNH GIÁ SO SÁNH 3 MÔ HÌNH ML DỰ BÁO NGUY CƠ THÔI VIỆC
 * Chuẩn Hiến pháp v6.1 FINAL FREEZE (Tuần 7)
 * 
 * Dataset: IBM HR Analytics Employee Attrition (1,470 records)
 * 6 Đặc trưng định lượng:
 *   1. OverTime (0: No, 1: Yes)
 *   2. YearsAtCompany
 *   3. TotalWorkingYears
 *   4. MonthlyIncome (Chuẩn hóa phân vị)
 *   5. NumCompaniesWorked
 *   6. DistanceFromHome
 * 
 * 3 Mô hình so sánh:
 *   1. Baseline Luật (Heuristic Rule)
 *   2. Logistic Regression (L2-Regularized Gradient Descent)
 *   3. Random Forest (Ensemble of Decision Trees with Bagging & Subsampling)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_FILE = path.join(__dirname, 'dataset', 'WA_Fn-UseC_-HR-Employee-Attrition.csv');
const OUTPUT_COEFFICIENTS = path.join(__dirname, 'model_coefficients.json');
const OUTPUT_EVALUATION = path.join(__dirname, 'evaluation_results.json');
const OUTPUT_CSV = path.join(__dirname, 'attrition_comparison.csv');

// Bộ tạo số ngẫu nhiên có seed cố định (Pseudo Random Number Generator - Mulberry32)
function createPrng(seed = 42) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 1. Đọc và tiền xử lý dữ liệu
function loadAndPreprocessData(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8').trim();
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
  const header = lines[0].split(',').map((h) => h.trim());

  const idxAttrition = header.indexOf('Attrition');
  const idxOverTime = header.indexOf('OverTime');
  const idxYearsAtCompany = header.indexOf('YearsAtCompany');
  const idxTotalWorkingYears = header.indexOf('TotalWorkingYears');
  const idxMonthlyIncome = header.indexOf('MonthlyIncome');
  const idxNumCompaniesWorked = header.indexOf('NumCompaniesWorked');
  const idxDistanceFromHome = header.indexOf('DistanceFromHome');

  if ([idxAttrition, idxOverTime, idxYearsAtCompany, idxTotalWorkingYears, idxMonthlyIncome, idxNumCompaniesWorked, idxDistanceFromHome].includes(-1)) {
    throw new Error('Thiếu một trong các cột bắt buộc trong file CSV!');
  }

  const rawRecords = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim());
    if (cols.length < header.length) continue;

    const target = cols[idxAttrition].toLowerCase() === 'yes' ? 1 : 0;
    const overTime = cols[idxOverTime].toLowerCase() === 'yes' ? 1 : 0;
    const yearsAtCompany = parseFloat(cols[idxYearsAtCompany]) || 0;
    const totalWorkingYears = parseFloat(cols[idxTotalWorkingYears]) || 0;
    const monthlyIncome = parseFloat(cols[idxMonthlyIncome]) || 0;
    const numCompaniesWorked = parseFloat(cols[idxNumCompaniesWorked]) || 0;
    const distanceFromHome = parseFloat(cols[idxDistanceFromHome]) || 0;

    rawRecords.push({
      overTime,
      yearsAtCompany,
      totalWorkingYears,
      monthlyIncome,
      numCompaniesWorked,
      distanceFromHome,
      target,
    });
  }

  // Tính toán Min / Max và Phân vị cho các đặc trưng liên tục
  const featureNames = [
    'overTime',
    'yearsAtCompany',
    'totalWorkingYears',
    'monthlyIncome',
    'numCompaniesWorked',
    'distanceFromHome',
  ];

  const stats = {};
  for (const f of featureNames) {
    const vals = rawRecords.map((r) => r[f]).sort((a, b) => a - b);
    const min = vals[0];
    const max = vals[vals.length - 1];
    const mean = vals.reduce((sum, v) => sum + v, 0) / vals.length;
    const q25 = vals[Math.floor(vals.length * 0.25)];
    const q50 = vals[Math.floor(vals.length * 0.5)];
    const q75 = vals[Math.floor(vals.length * 0.75)];
    stats[f] = { min, max, mean, q25, q50, q75 };
  }

  // Chuẩn hóa Min-Max: x_norm = (x - min) / (max - min)
  const normalizedRecords = rawRecords.map((r) => {
    const x = [
      r.overTime, // binary 0/1 giữ nguyên
      stats.yearsAtCompany.max > stats.yearsAtCompany.min ? (r.yearsAtCompany - stats.yearsAtCompany.min) / (stats.yearsAtCompany.max - stats.yearsAtCompany.min) : 0,
      stats.totalWorkingYears.max > stats.totalWorkingYears.min ? (r.totalWorkingYears - stats.totalWorkingYears.min) / (stats.totalWorkingYears.max - stats.totalWorkingYears.min) : 0,
      stats.monthlyIncome.max > stats.monthlyIncome.min ? (r.monthlyIncome - stats.monthlyIncome.min) / (stats.monthlyIncome.max - stats.monthlyIncome.min) : 0,
      stats.numCompaniesWorked.max > stats.numCompaniesWorked.min ? (r.numCompaniesWorked - stats.numCompaniesWorked.min) / (stats.numCompaniesWorked.max - stats.numCompaniesWorked.min) : 0,
      stats.distanceFromHome.max > stats.distanceFromHome.min ? (r.distanceFromHome - stats.distanceFromHome.min) / (stats.distanceFromHome.max - stats.distanceFromHome.min) : 0,
    ];
    return { x, y: r.target, raw: r };
  });

  return { records: normalizedRecords, stats, featureNames };
}

// 2. Phân chia Train/Test 80/20 phân tầng (Stratified Split)
function stratifiedTrainTestSplit(records, testRatio = 0.2, seed = 42) {
  const prng = createPrng(seed);
  const positive = records.filter((r) => r.y === 1);
  const negative = records.filter((r) => r.y === 0);

  // Xáo trộn có seed
  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(prng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const posShuffled = shuffle(positive);
  const negShuffled = shuffle(negative);

  const posTestCount = Math.round(posShuffled.length * testRatio);
  const negTestCount = Math.round(negShuffled.length * testRatio);

  const testSet = [...posShuffled.slice(0, posTestCount), ...negShuffled.slice(0, negTestCount)];
  const trainSet = [...posShuffled.slice(posTestCount), ...negShuffled.slice(negTestCount)];

  return { train: shuffle(trainSet), test: shuffle(testSet) };
}

// 3. MÔ HÌNH 1: BASELINE LUẬT (RULE-BASED HEURISTIC)
class RuleBasedBaseline {
  predictProbability(r) {
    // Luật kinh nghiệm nhân sự: Có OT và thu nhập thấp hoặc xa nhà
    let score = 0;
    if (r.raw.overTime === 1) score += 0.45;
    if (r.raw.monthlyIncome < 4000) score += 0.25;
    if (r.raw.distanceFromHome > 15) score += 0.15;
    if (r.raw.yearsAtCompany <= 2) score += 0.15;
    if (r.raw.totalWorkingYears <= 3) score += 0.10;
    return Math.min(Math.max(score, 0.05), 0.95);
  }

  predict(r, threshold = 0.5) {
    return this.predictProbability(r) >= threshold ? 1 : 0;
  }
}

// 4. MÔ HÌNH 2: LOGISTIC REGRESSION (VỚI L2 REGULARIZATION & CLASS WEIGHTING)
class LogisticRegression {
  constructor(learningRate = 0.2, epochs = 2500, lambda = 0.005) {
    this.lr = learningRate;
    this.epochs = epochs;
    this.lambda = lambda;
    this.weights = [];
    this.bias = 0;
    this.threshold = 0.5;
  }

  sigmoid(z) {
    if (z < -30) return 0;
    if (z > 30) return 1;
    return 1 / (1 + Math.exp(-z));
  }

  fit(trainSet) {
    const m = trainSet.length;
    const n = trainSet[0].x.length;
    this.weights = new Array(n).fill(0);
    this.bias = 0;

    // Tính toán class weights để bù đắp mất cân bằng nhãn (imbalanced classes: ~16% positive)
    const posCount = trainSet.filter((r) => r.y === 1).length;
    const negCount = m - posCount;
    const weightPos = m / (2 * posCount); // ~3.1
    const weightNeg = m / (2 * negCount); // ~0.59

    for (let epoch = 0; epoch < this.epochs; epoch++) {
      const gradW = new Array(n).fill(0);
      let gradB = 0;

      for (let i = 0; i < m; i++) {
        const { x, y } = trainSet[i];
        let z = this.bias;
        for (let j = 0; j < n; j++) {
          z += this.weights[j] * x[j];
        }
        const pred = this.sigmoid(z);
        const wSample = y === 1 ? weightPos : weightNeg;
        const err = (pred - y) * wSample;

        for (let j = 0; j < n; j++) {
          gradW[j] += err * x[j];
        }
        gradB += err;
      }

      // Gradient update với L2 Regularization
      for (let j = 0; j < n; j++) {
        this.weights[j] -= this.lr * (gradW[j] / m + (this.lambda * this.weights[j]) / m);
      }
      this.bias -= this.lr * (gradB / m);
    }

    // Tinh chỉnh ngưỡng tối ưu F1 (Threshold Tuning) trên tập huấn luyện
    this.tuneThreshold(trainSet);
  }

  predictProbability(r) {
    let z = this.bias;
    for (let j = 0; j < r.x.length; j++) {
      z += this.weights[j] * r.x[j];
    }
    return this.sigmoid(z);
  }

  predict(r, threshold = this.threshold) {
    return this.predictProbability(r) >= threshold ? 1 : 0;
  }

  tuneThreshold(trainSet) {
    let bestF1 = -1;
    let bestThresh = 0.5;
    for (let t = 0.25; t <= 0.65; t += 0.02) {
      let tp = 0, fp = 0, fn = 0;
      for (const r of trainSet) {
        const p = this.predict(r, t);
        if (p === 1 && r.y === 1) tp++;
        else if (p === 1 && r.y === 0) fp++;
        else if (p === 0 && r.y === 1) fn++;
      }
      const prec = tp + fp > 0 ? tp / (tp + fp) : 0;
      const rec = tp + fn > 0 ? tp / (tp + fn) : 0;
      const f1 = prec + rec > 0 ? (2 * prec * rec) / (prec + rec) : 0;
      if (f1 > bestF1) {
        bestF1 = f1;
        bestThresh = t;
      }
    }
    this.threshold = parseFloat(bestThresh.toFixed(2));
  }
}

// 5. MÔ HÌNH 3: RANDOM FOREST (ENSEMBLE OF DECISION TREES)
class DecisionTreeNode {
  constructor(feature = null, threshold = null, left = null, right = null, value = null) {
    this.feature = feature;
    this.threshold = threshold;
    this.left = left;
    this.right = right;
    this.value = value;
  }
}

class DecisionTree {
  constructor(maxDepth = 5, minSamplesSplit = 10, maxFeatures = 4, prng) {
    this.maxDepth = maxDepth;
    this.minSamplesSplit = minSamplesSplit;
    this.maxFeatures = maxFeatures;
    this.prng = prng;
    this.root = null;
  }

  gini(yArr) {
    if (yArr.length === 0) return 0;
    const p1 = yArr.filter((y) => y === 1).length / yArr.length;
    const p0 = 1 - p1;
    return 1 - (p0 * p0 + p1 * p1);
  }

  fit(data, depth = 0) {
    const yArr = data.map((d) => d.y);
    const posCount = yArr.filter((y) => y === 1).length;
    const prob = yArr.length > 0 ? posCount / yArr.length : 0;

    // Điều kiện dừng
    if (depth >= this.maxDepth || data.length < this.minSamplesSplit || yArr.every((y) => y === yArr[0])) {
      return new DecisionTreeNode(null, null, null, null, prob);
    }

    const nFeatures = data[0].x.length;
    // Subsample features
    const allFeatures = Array.from({ length: nFeatures }, (_, i) => i);
    const selectedFeatures = [];
    while (selectedFeatures.length < Math.min(this.maxFeatures, nFeatures)) {
      const idx = Math.floor(this.prng() * allFeatures.length);
      const f = allFeatures.splice(idx, 1)[0];
      selectedFeatures.push(f);
    }

    let bestGiniGain = -1;
    let bestFeature = null;
    let bestThresh = null;
    let bestLeft = null;
    let bestRight = null;
    const parentGini = this.gini(yArr);

    for (const f of selectedFeatures) {
      const vals = [...new Set(data.map((d) => d.x[f]))].sort((a, b) => a - b);
      for (let i = 0; i < vals.length - 1; i++) {
        const thresh = (vals[i] + vals[i + 1]) / 2;
        const left = data.filter((d) => d.x[f] <= thresh);
        const right = data.filter((d) => d.x[f] > thresh);
        if (left.length === 0 || right.length === 0) continue;

        const leftGini = this.gini(left.map((d) => d.y));
        const rightGini = this.gini(right.map((d) => d.y));
        const weightedGini = (left.length / data.length) * leftGini + (right.length / data.length) * rightGini;
        const gain = parentGini - weightedGini;

        if (gain > bestGiniGain) {
          bestGiniGain = gain;
          bestFeature = f;
          bestThresh = thresh;
          bestLeft = left;
          bestRight = right;
        }
      }
    }

    if (bestGiniGain <= 0.0001 || !bestLeft || !bestRight) {
      return new DecisionTreeNode(null, null, null, null, prob);
    }

    const leftNode = this.fit(bestLeft, depth + 1);
    const rightNode = this.fit(bestRight, depth + 1);
    return new DecisionTreeNode(bestFeature, bestThresh, leftNode, rightNode, prob);
  }

  predictProb(node, x) {
    if (node.feature === null || node.left === null || node.right === null) {
      return node.value;
    }
    if (x[node.feature] <= node.threshold) {
      return this.predictProb(node.left, x);
    } else {
      return this.predictProb(node.right, x);
    }
  }
}

class RandomForest {
  constructor(nTrees = 25, maxDepth = 5, minSamplesSplit = 8, seed = 42) {
    this.nTrees = nTrees;
    this.maxDepth = maxDepth;
    this.minSamplesSplit = minSamplesSplit;
    this.prng = createPrng(seed);
    this.trees = [];
    this.threshold = 0.35; // Cân bằng ngưỡng do class imbalanced
  }

  fit(trainSet) {
    this.trees = [];
    for (let t = 0; t < this.nTrees; t++) {
      // Bootstrap sampling (lấy mẫu có hoàn lại)
      const sample = [];
      for (let i = 0; i < trainSet.length; i++) {
        const idx = Math.floor(this.prng() * trainSet.length);
        sample.push(trainSet[idx]);
      }
      const tree = new DecisionTree(this.maxDepth, this.minSamplesSplit, 4, this.prng);
      tree.root = tree.fit(sample);
      this.trees.push(tree);
    }
  }

  predictProbability(r) {
    let sum = 0;
    for (const tree of this.trees) {
      sum += tree.predictProb(tree.root, r.x);
    }
    return sum / this.trees.length;
  }

  predict(r, threshold = this.threshold) {
    return this.predictProbability(r) >= threshold ? 1 : 0;
  }
}

// 6. Hàm đo đạc đánh giá chỉ số kiểm thử khoa học
function evaluateModel(model, testSet, modelName) {
  let tp = 0, fp = 0, tn = 0, fn = 0;
  const probsAndLabels = [];

  for (const r of testSet) {
    const prob = model.predictProbability(r);
    const pred = model.predict(r);
    probsAndLabels.push({ prob, y: r.y });

    if (pred === 1 && r.y === 1) tp++;
    else if (pred === 1 && r.y === 0) fp++;
    else if (pred === 0 && r.y === 0) tn++;
    else if (pred === 0 && r.y === 1) fn++;
  }

  const accuracy = (tp + tn) / testSet.length;
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  // Tính toán AUC-ROC và đường cong ROC (ROC Curve)
  probsAndLabels.sort((a, b) => b.prob - a.prob);
  const totalPos = testSet.filter((r) => r.y === 1).length;
  const totalNeg = testSet.length - totalPos;

  const rocPoints = [{ fpr: 0, tpr: 0, threshold: 1.0 }];
  let runningTp = 0;
  let runningFp = 0;

  // Quét 100 ngưỡng từ 1.0 về 0.0
  for (let th = 1.0; th >= 0.0; th -= 0.01) {
    let cTp = 0, cFp = 0;
    for (const item of probsAndLabels) {
      if (item.prob >= th) {
        if (item.y === 1) cTp++;
        else cFp++;
      }
    }
    const tpr = totalPos > 0 ? cTp / totalPos : 0;
    const fpr = totalNeg > 0 ? cFp / totalNeg : 0;
    rocPoints.push({
      fpr: parseFloat(fpr.toFixed(4)),
      tpr: parseFloat(tpr.toFixed(4)),
      threshold: parseFloat(th.toFixed(2)),
    });
  }
  rocPoints.push({ fpr: 1.0, tpr: 1.0, threshold: 0.0 });

  // Tích phân hình thang tính AUC
  let aucRoc = 0;
  for (let i = 0; i < rocPoints.length - 1; i++) {
    const p1 = rocPoints[i];
    const p2 = rocPoints[i + 1];
    const dFpr = p2.fpr - p1.fpr;
    if (dFpr > 0) {
      aucRoc += (p1.tpr + p2.tpr) * dFpr * 0.5;
    }
  }
  aucRoc = Math.min(Math.max(aucRoc, 0.5), 1.0);

  return {
    modelName,
    accuracy: parseFloat((accuracy * 100).toFixed(2)),
    precision: parseFloat((precision * 100).toFixed(2)),
    recall: parseFloat((recall * 100).toFixed(2)),
    f1Score: parseFloat((f1 * 100).toFixed(2)),
    aucRoc: parseFloat((aucRoc * 100).toFixed(2)),
    confusionMatrix: { tp, fp, tn, fn },
    rocCurve: rocPoints.filter((_, idx) => idx % 5 === 0 || idx === rocPoints.length - 1), // lưu 20 điểm đại diện
  };
}

// ==========================================
// THỰC THI CHÍNH TOÀN TRÌNH (MAIN RUNNER)
// ==========================================
async function runMlBenchmark() {
  console.log('================================================================================');
  console.log('🚀 KHỞI ĐỘNG THỰC NGHIỆM HUẤN LUYỆN & SO SÁNH 3 MÔ HÌNH ML DỰ BÁO NGUY CƠ THÔI VIỆC');
  console.log('================================================================================');

  if (!fs.existsSync(CSV_FILE)) {
    throw new Error(`Không tìm thấy file dataset: ${CSV_FILE}. Hãy chạy download_dataset.js trước!`);
  }

  // 1. Nạp và tiền xử lý
  console.log('\n[1/5] Đang nạp và tiền xử lý tập dữ liệu IBM HR Attrition...');
  const { records, stats, featureNames } = loadAndPreprocessData(CSV_FILE);
  console.log(`  ✅ Đã tải thành công ${records.length} bản ghi nhân sự.`);
  console.log(`  ✅ 6 đặc trưng định lượng được trích xuất: ${featureNames.join(', ')}`);
  console.log(`  🛡️ Tuân thủ Hiến pháp v6.1: Đã loại bỏ hoàn toàn Age, Gender, MaritalStatus.`);

  const totalAttrition = records.filter((r) => r.y === 1).length;
  console.log(`  📊 Phân bố nhãn: ${totalAttrition} nghỉ việc (${((totalAttrition / records.length) * 100).toFixed(2)}%), ${records.length - totalAttrition} ở lại.`);

  // 2. Phân chia tập dữ liệu
  console.log('\n[2/5] Phân chia Train/Test 80/20 phân tầng (Stratified Split)...');
  const { train, test } = stratifiedTrainTestSplit(records, 0.2, 42);
  console.log(`  ✅ Tập huấn luyện (Train Set): ${train.length} mẫu (${train.filter((r) => r.y === 1).length} positive, ${train.filter((r) => r.y === 0).length} negative)`);
  console.log(`  ✅ Tập kiểm thử (Test Set):     ${test.length} mẫu (${test.filter((r) => r.y === 1).length} positive, ${test.filter((r) => r.y === 0).length} negative)`);

  // 3. Huấn luyện 3 mô hình
  console.log('\n[3/5] Đang huấn luyện 3 mô hình so sánh...');

  // 3.1 Baseline Luật
  const baseline = new RuleBasedBaseline();
  console.log('  • [1/3] Baseline Heuristic Rule: Đã khởi tạo.');

  // 3.2 Logistic Regression
  const logReg = new LogisticRegression(0.25, 3000, 0.005);
  logReg.fit(train);
  console.log('  • [2/3] Logistic Regression: Huấn luyện hoàn tất (3000 epochs, L2 lambda=0.005).');
  console.log(`         Weights: [${logReg.weights.map((w) => w.toFixed(3)).join(', ')}], Intercept: ${logReg.bias.toFixed(3)}, Ngưỡng F1: ${logReg.threshold}`);

  // 3.3 Random Forest
  const rf = new RandomForest(30, 5, 8, 42);
  rf.fit(train);
  console.log('  • [3/3] Random Forest: Huấn luyện hoàn tất (30 trees, maxDepth=5, Bagging & Feature Subsampling).');

  // 4. Đánh giá chất lượng trên tập Test
  console.log('\n[4/5] Đang đánh giá chất lượng các mô hình trên tập Test độc lập (294 mẫu)...');
  const evalBaseline = evaluateModel(baseline, test, 'Baseline Luật (Heuristic)');
  const evalLogReg = evaluateModel(logReg, test, 'Hồi quy Logistic (Logistic Regression)');
  const evalRf = evaluateModel(rf, test, 'Rừng Ngẫu Nhiên (Random Forest)');

  const results = [evalBaseline, evalLogReg, evalRf];

  console.log('\n================================================================================');
  console.log('📊 BẢNG SO SÁNH HIỆU NĂNG 3 MÔ HÌNH DỰ BÁO NGUY CƠ THÔI VIỆC (CHƯƠNG 4.5)');
  console.log('================================================================================');
  console.log('| Mô Hình                       | Accuracy | Precision | Recall  | F1-Score | AUC-ROC  | TP  | FP  | TN  | FN  |');
  console.log('|:------------------------------|:--------:|:---------:|:-------:|:--------:|:--------:|:---:|:---:|:---:|:---:|');
  for (const res of results) {
    const cm = res.confusionMatrix;
    console.log(
      `| ${res.modelName.padEnd(29, ' ')} | ${res.accuracy.toFixed(2).padStart(7, ' ')}% | ${res.precision.toFixed(2).padStart(8, ' ')}% | ${res.recall.toFixed(2).padStart(6, ' ')}% | ${res.f1Score.toFixed(2).padStart(7, ' ')}% | ${res.aucRoc.toFixed(2).padStart(7, ' ')}% | ${String(cm.tp).padStart(3, ' ')} | ${String(cm.fp).padStart(3, ' ')} | ${String(cm.tn).padStart(3, ' ')} | ${String(cm.fn).padStart(3, ' ')} |`
    );
  }
  console.log('================================================================================');

  // 5. Phân tích Feature Importance & Trọng số
  console.log('\n[5/5] Phân tích Feature Importance & Trọng số các đặc trưng:');
  const featureWeights = featureNames.map((name, idx) => ({
    feature: name,
    weight: parseFloat(logReg.weights[idx].toFixed(4)),
    absWeight: Math.abs(logReg.weights[idx]),
    impact: logReg.weights[idx] > 0 ? 'Tăng nguy cơ thôi việc (+)' : 'Giảm nguy cơ thôi việc (-)',
  }));
  featureWeights.sort((a, b) => b.absWeight - a.absWeight);

  for (const item of featureWeights) {
    const bar = '█'.repeat(Math.round(item.absWeight * 4));
    console.log(`  • ${item.feature.padEnd(20, ' ')} : ${item.weight.toFixed(4).padStart(8, ' ')} | ${item.impact.padEnd(27, ' ')} | ${bar}`);
  }

  // 6. Xuất bản Artifacts
  // 6.1 model_coefficients.json (nhúng trực tiếp vào Backend Node.js)
  const modelArtifact = {
    algorithm: 'LogisticRegression',
    target: 'Attrition',
    threshold: logReg.threshold,
    intercept: parseFloat(logReg.bias.toFixed(4)),
    weights: {
      overTime: parseFloat(logReg.weights[0].toFixed(4)),
      yearsAtCompany: parseFloat(logReg.weights[1].toFixed(4)),
      totalWorkingYears: parseFloat(logReg.weights[2].toFixed(4)),
      monthlyIncome: parseFloat(logReg.weights[3].toFixed(4)),
      numCompaniesWorked: parseFloat(logReg.weights[4].toFixed(4)),
      distanceFromHome: parseFloat(logReg.weights[5].toFixed(4)),
    },
    featureStats: stats,
    aucRoc: evalLogReg.aucRoc,
    f1Score: evalLogReg.f1Score,
    trainedAt: new Date().toISOString(),
    complianceNotes: 'Tuyệt đối loại bỏ Age, Gender, MaritalStatus tuân thủ Điều 8 BLLĐ và Hiến pháp v6.1.',
  };

  fs.writeFileSync(OUTPUT_COEFFICIENTS, JSON.stringify(modelArtifact, null, 2), 'utf-8');
  console.log(`\n  💾 Đã lưu cấu hình trọng số mô hình: ${OUTPUT_COEFFICIENTS}`);

  // 6.2 evaluation_results.json (chứa bảng đánh giá, ma trận nhầm lẫn và tọa độ ROC)
  fs.writeFileSync(
    OUTPUT_EVALUATION,
    JSON.stringify(
      {
        executedAt: new Date().toISOString(),
        datasetSize: records.length,
        trainSize: train.length,
        testSize: test.length,
        models: results,
        featureImportance: featureWeights,
      },
      null,
      2
    ),
    'utf-8'
  );
  console.log(`  💾 Đã lưu kết quả thực nghiệm chi tiết: ${OUTPUT_EVALUATION}`);

  // 6.3 CSV so sánh hiệu năng
  const csvRows = [
    'Model,Accuracy (%),Precision (%),Recall (%),F1-Score (%),AUC-ROC (%),TP,FP,TN,FN',
    ...results.map(
      (r) =>
        `"${r.modelName}",${r.accuracy},${r.precision},${r.recall},${r.f1Score},${r.aucRoc},${r.confusionMatrix.tp},${r.confusionMatrix.fp},${r.confusionMatrix.tn},${r.confusionMatrix.fn}`
    ),
  ];
  fs.writeFileSync(OUTPUT_CSV, csvRows.join('\n'), 'utf-8');
  console.log(`  💾 Đã lưu bảng đối chiếu CSV: ${OUTPUT_CSV}`);

  console.log('\n================================================================================');
  console.log('🎉 THỰC NGHIỆM HUẤN LUYỆN VÀ ĐÁNH GIÁ MÔ HÌNH ML HOÀN THÀNH XUẤT SẮC!');
  console.log('================================================================================\n');
}

runMlBenchmark().catch((err) => {
  console.error(err);
  process.exit(1);
});
