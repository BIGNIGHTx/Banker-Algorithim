// Import React และ useState hook สำหรับจัดการ state
import React, { useState } from 'react';
// Import icons จาก lucide-react สำหรับแสดงสัญลักษณ์ต่างๆ
import { AlertCircle, CheckCircle, XCircle, Calculator, RefreshCw } from 'lucide-react';
// Import CSS
import './App.css';

// Component หลักสำหรับตรวจสอบ Safe State ด้วย Banker's Algorithm
export default function SafeStateChecker() {
  // State สำหรับเก็บจำนวน Processes (กระบวนการ) ค่าเริ่มต้น = 3
  const [numProcesses, setNumProcesses] = useState(3);
  
  // State สำหรับเก็บจำนวน Resource Types (ประเภททรัพยากร) ค่าเริ่มต้น = 3
  const [numResources, setNumResources] = useState(3);
  
  // State สำหรับเก็บ Allocation Matrix (ทรัพยากรที่จัดสรรให้แต่ละ Process แล้ว)
  // allocation[i][j] = จำนวนทรัพยากรประเภท j ที่จัดสรรให้ Process i
  const [allocation, setAllocation] = useState([
    [0, 1, 0], // Process 0 ได้รับทรัพยากร: R0=0, R1=1, R2=0
    [2, 0, 0], // Process 1 ได้รับทรัพยากร: R0=2, R1=0, R2=0
    [3, 0, 2]  // Process 2 ได้รับทรัพยากร: R0=3, R1=0, R2=2
  ]);
  
  // State สำหรับเก็บ Max Matrix (ทรัพยากรสูงสุดที่แต่ละ Process ต้องการ)
  // max[i][j] = จำนวนทรัพยากรประเภท j สูงสุดที่ Process i ต้องการ
  const [max, setMax] = useState([
    [7, 5, 3], // Process 0 ต้องการทรัพยากรสูงสุด: R0=7, R1=5, R2=3
    [3, 2, 2], // Process 1 ต้องการทรัพยากรสูงสุด: R0=3, R1=2, R2=2
    [9, 0, 2]  // Process 2 ต้องการทรัพยากรสูงสุด: R0=9, R1=0, R2=2
  ]);
  
  // State สำหรับเก็บ Available Resources (ทรัพยากรที่ว่างในระบบ)
  // available[j] = จำนวนทรัพยากรประเภท j ที่ยังใช้ได้
  const [available, setAvailable] = useState([3, 3, 2]); // R0=3, R1=3, R2=2
  
  // State สำหรับเก็บผลลัพธ์การคำนวณ (null = ยังไม่ได้คำนวณ)
  const [result, setResult] = useState(null);
  
  // State สำหรับเก็บขั้นตอนปัจจุบัน (1=กำหนดจำนวน, 2=กรอกข้อมูล)
  const [step, setStep] = useState(1);

  // ฟังก์ชันสำหรับสร้าง Matrix ใหม่เมื่อเปลี่ยนจำนวน Process หรือ Resource
  const initializeMatrices = () => {
    // สร้าง Allocation Matrix ใหม่ เป็น array 2 มิติ ค่าเริ่มต้นเป็น 0 ทั้งหมด
    // Array(numProcesses) = สร้าง array ขนาด numProcesses
    // .fill(0) = เติมค่า 0
    // .map(() => Array(numResources).fill(0)) = แต่ละตัวสร้างเป็น array ขนาด numResources
    const newAllocation = Array(numProcesses).fill(0).map(() => Array(numResources).fill(0));
    
    // สร้าง Max Matrix ใหม่ เป็น array 2 มิติ ค่าเริ่มต้นเป็น 0 ทั้งหมด
    const newMax = Array(numProcesses).fill(0).map(() => Array(numResources).fill(0));
    
    // สร้าง Available array ใหม่ เป็น array 1 มิติ ค่าเริ่มต้นเป็น 0 ทั้งหมด
    const newAvailable = Array(numResources).fill(0);
    
    // อัพเดท state ทั้งหมด
    setAllocation(newAllocation);
    setMax(newMax);
    setAvailable(newAvailable);
    setResult(null); // ล้างผลลัพธ์เดิม
  };

  // ฟังก์ชันคำนวณ Need Matrix (ความต้องการทรัพยากรที่เหลือของแต่ละ Process)
  // สูตร: Need[i][j] = Max[i][j] - Allocation[i][j]
  const calculateNeed = () => {
    // วนลูปผ่านทุก Process (i)
    return allocation.map((alloc, i) => 
      // วนลูปผ่านทุก Resource (j) และคำนวณ Need
      alloc.map((val, j) => max[i][j] - val)
      // ตัวอย่าง: Process 0, Resource 0 => Need = 7 - 0 = 7
    );
  };

  // ฟังก์ชันหลักสำหรับตรวจสอบสถานะของระบบ (Safe หรือ Unsafe)
  // ใช้ Banker's Algorithm
  const checkSafeState = () => {
    // Step 1: คำนวณ Need Matrix
    const need = calculateNeed();
    
    // Step 2: สร้าง Work array (ทรัพยากรที่ใช้ได้ในแต่ละขั้นตอน)
    // เริ่มต้นเท่ากับ Available
    const work = [...available];
    
    // Step 3: สร้าง Finish array (เก็บสถานะว่า Process ไหนเสร็จแล้ว)
    // false = ยังไม่เสร็จ, true = เสร็จแล้ว
    const finish = Array(numProcesses).fill(false);
    
    // Step 4: สร้าง Safe Sequence array (ลำดับการทำงานที่ปลอดภัย)
    const safeSequence = [];
    
    // Step 5: สร้าง Steps array (เก็บขั้นตอนการคำนวณแต่ละรอบ)
    const steps = [];

    // Step 6: วนลูปหา Process ที่สามารถทำงานได้
    let found = true; // flag บอกว่ายังหา Process ได้อยู่หรือไม่
    
    // วนลูปจนกว่าจะหา Process ไม่เจอ หรือ Process ทั้งหมดเสร็จแล้ว
    while (found && safeSequence.length < numProcesses) {
      found = false; // รีเซ็ต flag
      
      // วนลูปตรวจสอบทุก Process
      for (let i = 0; i < numProcesses; i++) {
        // ถ้า Process i ยังไม่เสร็จ
        if (!finish[i]) {
          let canAllocate = true; // flag บอกว่าสามารถจัดสรรทรัพยากรได้หรือไม่
          
          // ตรวจสอบว่า Work มีเพียงพอสำหรับ Need ของ Process i หรือไม่
          for (let j = 0; j < numResources; j++) {
            // ถ้า Need > Work แปลว่าทรัพยากรไม่พอ
            if (need[i][j] > work[j]) {
              canAllocate = false;
              break; // ออกจาก loop ทันที
            }
          }
          
          // ถ้าทรัพยากรเพียงพอ
          if (canAllocate) {
            // บันทึกขั้นตอนการคำนวณ
            steps.push({
              process: i,           // Process ที่เลือก
              work: [...work],      // Work ก่อนการจัดสรร
              need: [...need[i]],   // Need ของ Process นี้
              allocation: [...allocation[i]] // Allocation ของ Process นี้
            });
            
            // คืนทรัพยากรที่ Process ใช้กลับเข้า Work
            // เพราะสมมติว่า Process ทำงานเสร็จแล้ว
            for (let j = 0; j < numResources; j++) {
              work[j] += allocation[i][j];
            }
            
            // ทำเครื่องหมายว่า Process i เสร็จแล้ว
            finish[i] = true;
            
            // เพิ่ม Process i เข้า Safe Sequence
            safeSequence.push(i);
            
            // พบ Process ที่ทำงานได้ ให้ลูปต่อ
            found = true;
            break; // ออกจาก for loop เพื่อเริ่มรอบใหม่
          }
        }
      }
    }

    // Step 7: ตรวจสอบว่าระบบ Safe หรือไม่
    // ถ้า Safe Sequence มี Process ครบทุกตัว = ระบบ Safe
    const isSafe = safeSequence.length === numProcesses;
    
    // Step 8: เก็บผลลัพธ์
    setResult({
      isSafe,          // สถานะ Safe หรือ Unsafe
      safeSequence,    // ลำดับ Safe Sequence
      need,            // Need Matrix
      steps,           // ขั้นตอนการคำนวณ
      finalWork: work  // ทรัพยากรที่เหลือสุดท้าย
    });
  };

  // ฟังก์ชันสำหรับอัพเดทค่าใน Allocation Matrix
  // i = index ของ Process, j = index ของ Resource, value = ค่าใหม่
  const updateAllocation = (i, j, value) => {
    const newAllocation = [...allocation]; // Copy array เดิม
    newAllocation[i][j] = parseInt(value) || 0; // แปลงเป็นตัวเลข ถ้าไม่ใช่ให้เป็น 0
    setAllocation(newAllocation); // อัพเดท state
  };

  // ฟังก์ชันสำหรับอัพเดทค่าใน Max Matrix
  // i = index ของ Process, j = index ของ Resource, value = ค่าใหม่
  const updateMax = (i, j, value) => {
    const newMax = [...max]; // Copy array เดิม
    newMax[i][j] = parseInt(value) || 0; // แปลงเป็นตัวเลข ถ้าไม่ใช่ให้เป็น 0
    setMax(newMax); // อัพเดท state
  };

  // ฟังก์ชันสำหรับอัพเดทค่าใน Available array
  // j = index ของ Resource, value = ค่าใหม่
  const updateAvailable = (j, value) => {
    const newAvailable = [...available]; // Copy array เดิม
    newAvailable[j] = parseInt(value) || 0; // แปลงเป็นตัวเลข ถ้าไม่ใช่ให้เป็น 0
    setAvailable(newAvailable); // อัพเดท state
  };

  // ฟังก์ชันสำหรับรีเซ็ตและคำนวณใหม่
  const reset = () => {
    setResult(null); // ล้างผลลัพธ์
    setStep(1);      // กลับไปขั้นตอนที่ 1
  };

  // ส่วน JSX - โครงสร้าง UI ของโปรแกรม
  return (
    // Container หลัก: พื้นหลังไล่เฉดสี Silver/Gray gradient พร้อม pattern
    <div className="app-container">
      {/* Background Pattern Overlay */}
      <div className="shine-effect-1"></div>
      <div className="shine-effect-2"></div>
      
      {/* กรอบเนื้อหาหลัก ความกว้างสูงสุด 7xl และจัดกึ่งกลาง */}
      <div className="content-wrapper">
        {/* Header: หัวข้อโปรแกรม */}
        <div className="header">
          <div className="header-title-wrapper">
            <h1 className="header-title">Safe State Checker</h1>
          </div>
          <p className="header-subtitle">ตรวจสอบสถานะระบบด้วย Banker's Algorithm</p>
          
        </div>

        {/* ขั้นตอนที่ 1: กำหนดจำนวน Process และ Resource */}
        {/* แสดงเฉพาะเมื่อ step === 1 */}
        {step === 1 && (
          <div className="card">
            {/* หัวข้อขั้นตอนที่ 1 */}
            <h2 className="step-title">
              <div className="step-number">1</div>
              กำหนดจำนวน Process และ Resource
            </h2>
            
            {/* Grid 2 คอลัมน์สำหรับ input */}
            <div className="form-grid">
              {/* Input: จำนวน Processes */}
              <div>
                <label className="form-label">
                  จำนวน Processes
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={numProcesses}
                  onChange={(e) => setNumProcesses(parseInt(e.target.value) || 1)}
                  className="form-input"
                />
              </div>
              
              {/* Input: จำนวน Resource Types */}
              <div>
                <label className="form-label">
                  จำนวน Resource Types
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={numResources}
                  onChange={(e) => setNumResources(parseInt(e.target.value) || 1)}
                  className="form-input"
                />
              </div>
            </div>

            {/* ปุ่มถัดไป: เมื่อกดจะสร้าง Matrix ใหม่และไปขั้นตอนที่ 2 */}
            <button
              onClick={() => { initializeMatrices(); setStep(2); }}
              className="btn-primary"
            >
              ถัดไป
            </button>
          </div>
        )}

        {/* ขั้นตอนที่ 2: กรอกข้อมูล Allocation, Max, Available */}
        {/* แสดงเฉพาะเมื่อ step === 2 */}
        {step === 2 && (
          <div className="step-container">
            {/* ส่วนที่ 1: Allocation Matrix */}
            <div className="card">
              <h2 className="section-title section-title-allocation">
                <div className="step-number step-number-allocation">2</div>
                กรอกข้อมูล Allocation Matrix
              </h2>
              
              {/* ตาราง Allocation Matrix */}
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      {/* หัวตาราง: Process */}
                      <th className="table-header-process">Process</th>
                      {/* หัวตาราง: แต่ละ Resource (R0, R1, R2, ...) */}
                      {Array.from({length: numResources}, (_, j) => (
                        <th key={j} className="table-header-allocation">R{j}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* วนลูปสร้างแถวสำหรับแต่ละ Process */}
                    {Array.from({length: numProcesses}, (_, i) => (
                      <tr key={i}>
                        {/* คอลัมน์แรก: ชื่อ Process (P0, P1, P2, ...) */}
                        <td className="table-cell-process">P{i}</td>
                        {/* วนลูปสร้างช่อง input สำหรับแต่ละ Resource */}
                        {Array.from({length: numResources}, (_, j) => (
                          <td key={j} className="table-cell-input">
                            {/* Input สำหรับกรอกค่า Allocation[i][j] */}
                            <input
                              type="number"
                              min="0"
                              value={allocation[i][j]}
                              onChange={(e) => updateAllocation(i, j, e.target.value)}
                              className="table-input"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ส่วนที่ 2: Max Matrix */}
            <div className="card">
              <h2 className="section-title section-title-max">
                <div className="step-number step-number-max">3</div>
                กรอกข้อมูล Max Matrix
              </h2>
              
              {/* ตาราง Max Matrix - โครงสร้างเหมือน Allocation Matrix */}
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="table-header-process">Process</th>
                      {/* สีพื้นหลังเป็นสีม่วง (purple) เพื่อแยกจาก Allocation */}
                      {Array.from({length: numResources}, (_, j) => (
                        <th key={j} className="table-header-max">R{j}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({length: numProcesses}, (_, i) => (
                      <tr key={i}>
                        <td className="table-cell-process">P{i}</td>
                        {Array.from({length: numResources}, (_, j) => (
                          <td key={j} className="table-cell-input">
                            {/* Input สำหรับกรอกค่า Max[i][j] */}
                            <input
                              type="number"
                              min="0"
                              value={max[i][j]}
                              onChange={(e) => updateMax(i, j, e.target.value)}
                              className="table-input"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ส่วนที่ 3: Available Resources */}
            <div className="card">
              <h2 className="section-title section-title-available">
                <div className="step-number step-number-available">4</div>
                กรอกข้อมูล Available Resources
              </h2>
              
              {/* Grid สำหรับ input แต่ละ Resource */}
              {/* แสดง 2 คอลัมน์บนหน้าจอเล็ก, 4 คอลัมน์บนหน้าจอกลาง, 6 คอลัมน์บนหน้าจอใหญ่ */}
              <div className="resource-grid">
                {/* วนลูปสร้าง input สำหรับแต่ละ Resource */}
                {Array.from({length: numResources}, (_, j) => (
                  <div key={j}>
                    <label className="resource-label">
                      Resource {j}
                    </label>
                    {/* Input สำหรับกรอกค่า Available[j] */}
                    <input
                      type="number"
                      min="0"
                      value={available[j]}
                      onChange={(e) => updateAvailable(j, e.target.value)}
                      className="resource-input"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* ปุ่มย้อนกลับ และ คำนวณผลลัพธ์ */}
            <div className="button-group">
              {/* ปุ่มย้อนกลับ: กลับไปขั้นตอนที่ 1 */}
              <button
                onClick={() => setStep(1)}
                className="btn-secondary"
              >
                ย้อนกลับ
              </button>
              {/* ปุ่มคำนวณ: เรียกใช้ checkSafeState() */}
              <button
                onClick={checkSafeState}
                className="btn-calculate"
              >
                <Calculator size={22} />
                คำนวณผลลัพธ์
              </button>
            </div>
          </div>
        )}

        {/* ส่วนแสดงผลลัพธ์ */}
        {/* แสดงเฉพาะเมื่อ result ไม่เป็น null (คำนวณแล้ว) */}
        {result && (
          <div className="result-container">
            {/* การ์ดแสดงสถานะ Safe/Unsafe */}
            {/* ถ้า Safe: พื้นหลังเขียว, ถ้า Unsafe: พื้นหลังแดง */}
            <div className={result.isSafe ? 'result-card-safe' : 'result-card-unsafe'}>
              <div className="result-header">
                {/* ถ้า Safe: แสดง CheckCircle icon สีเขียว */}
                {result.isSafe ? (
                  <>
                    <CheckCircle size={56} className="result-icon-safe" />
                    <div>
                      <h2 className="result-title-safe">System is SAFE</h2>
                      <p className="result-subtitle-safe">ระบบอยู่ในสถานะปลอดภัย</p>
                    </div>
                  </>
                ) : (
                  /* ถ้า Unsafe: แสดง XCircle icon สีแดง */
                  <>
                    <XCircle size={56} className="result-icon-unsafe" />
                    <div>
                      <h2 className="result-title-unsafe">System is UNSAFE</h2>
                      <p className="result-subtitle-unsafe">ระบบอาจเกิด Deadlock</p>
                    </div>
                  </>
                )}
              </div>

              {/* แสดง Safe Sequence เฉพาะเมื่อระบบ Safe */}
              {result.isSafe && (
                <div className="sequence-container">
                  <h3 className="sequence-title">Safe Sequence:</h3>
                  {/* แสดงลำดับ Process ที่สามารถทำงานได้ */}
                  <div className="sequence-list">
                    {/* วนลูปแสดงแต่ละ Process ใน Safe Sequence */}
                    {result.safeSequence.map((process, idx) => (
                      <React.Fragment key={idx}>
                        {/* กล่องสีเขียวแสดงหมายเลข Process */}
                        <div className="sequence-item">
                          P{process}
                        </div>
                        {/* แสดงลูกศร → ระหว่าง Process (ยกเว้นตัวสุดท้าย) */}
                        {idx < result.safeSequence.length - 1 && (
                          <div className="sequence-arrow">→</div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ตารางแสดง Need Matrix */}
            <div className="card">
              <h3 className="section-title section-title-need">Need Matrix (Max - Allocation)</h3>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="table-header-process">Process</th>
                      {/* หัวตาราง Resource สีม่วงอ่อน (indigo) */}
                      {Array.from({length: numResources}, (_, j) => (
                        <th key={j} className="table-header-need">R{j}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* วนลูปแสดงค่า Need แต่ละ Process */}
                    {result.need.map((row, i) => (
                      <tr key={i}>
                        <td className="table-cell-process">P{i}</td>
                        {/* วนลูปแสดงค่า Need แต่ละ Resource */}
                        {row.map((val, j) => (
                          <td key={j} className="table-cell-value">{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* แสดงขั้นตอนการคำนวณ (เฉพาะเมื่อระบบ Safe และมีขั้นตอน) */}
            {result.isSafe && result.steps.length > 0 && (
              <div className="card">
                <h3 className="section-title">ขั้นตอนการคำนวณ</h3>
                <div className="steps-container">
                  {/* วนลูปแสดงแต่ละขั้นตอนการคำนวณ */}
                  {result.steps.map((step, idx) => (
                    <div key={idx} className="step-item">
                      {/* หัวข้อแต่ละขั้นตอน */}
                      <div className="step-item-header">
                        {/* หมายเลขขั้นตอน */}
                        <div className="step-item-number">
                          {idx + 1}
                        </div>
                        <h4 className="step-item-title">
                          เลือก Process P{step.process}
                        </h4>
                      </div>
                      {/* แสดงรายละเอียด: Need, Work, Allocation */}
                      <div className="step-item-details">
                        {/* Need: ความต้องการทรัพยากร */}
                        <div className="step-detail-box">
                          <span className="step-detail-label">Need:</span>
                          <span className="step-detail-value">[{step.need.join(', ')}]</span>
                        </div>
                        {/* Work: ทรัพยากรที่มีในขณะนั้น */}
                        <div className="step-detail-box">
                          <span className="step-detail-label">Work:</span>
                          <span className="step-detail-value">[{step.work.join(', ')}]</span>
                        </div>
                        {/* Allocation: ทรัพยากรที่ Process ถือ */}
                        <div className="step-detail-box">
                          <span className="step-detail-label">Allocation:</span>
                          <span className="step-detail-value">[{step.allocation.join(', ')}]</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ปุ่มคำนวณใหม่ */}
            <button
              onClick={reset}
              className="btn-reset"
            >
              <RefreshCw size={22} />
              คำนวณใหม่
            </button>
          </div>
        )}

        {/* Footer: ข้อมูลผู้พัฒนา */}
        <div className="footer">
          
        </div>
      </div>
    </div>
  );
}
