// 全局变量
let timerInterval = null;
let pauseTimerInterval = null;
let currentTime = 25 * 60; // 默认25分钟
let originalTime = 25 * 60;
let isRunning = false;
let isPaused = false;
let pauseTime = 5 * 60; // 暂停倒计时5分钟
let currentTask = null;
let isBreakTime = false;
let breakDuration = 5 * 60; // 默认5分钟休息

// DOM元素
const timerDisplay = document.getElementById('timerDisplay');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const durationBtns = document.querySelectorAll('.duration-btn');
const customDuration = document.getElementById('customDuration');
const taskType = document.getElementById('taskType');
const customTaskType = document.getElementById('customTaskType');
const taskName = document.getElementById('taskName');
const todoList = document.getElementById('todoList');
const completedList = document.getElementById('completedList');
const notes = document.getElementById('notes');
const startDate = document.getElementById('startDate');
const endDate = document.getElementById('endDate');
const filterTaskType = document.getElementById('filterTaskType');
const filterStatus = document.getElementById('filterStatus');
const exportBtn = document.getElementById('exportBtn');

// 初始化
function init() {
  // 加载本地存储数据
  loadData();
  
  // 绑定事件监听器
  bindEventListeners();
  
  // 更新倒计时显示
  updateTimerDisplay();
  
  // 渲染任务列表
  renderTaskLists();
}

// 绑定事件监听器
function bindEventListeners() {
  // 开始按钮
  startBtn.addEventListener('click', startTimer);
  
  // 暂停按钮
  pauseBtn.addEventListener('click', pauseTimer);
  
  // 重置按钮
  resetBtn.addEventListener('click', resetTimer);
  
  // 时长快捷选项
  durationBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const duration = parseInt(btn.dataset.duration);
      setDuration(duration);
      
      // 更新按钮状态
      durationBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
  
  // 自定义时长输入
  customDuration.addEventListener('input', () => {
    const duration = parseInt(customDuration.value);
    if (duration && duration >= 1 && duration <= 60) {
      setDuration(duration);
      durationBtns.forEach(b => b.classList.remove('active'));
    }
  });
  
  // 任务类型选择
  taskType.addEventListener('change', () => {
    if (taskType.value === '自定义') {
      customTaskType.style.display = 'block';
    } else {
      customTaskType.style.display = 'none';
    }
  });
  
  // 临时记录本输入
  notes.addEventListener('input', saveNotes);
  
  // 导出按钮
  exportBtn.addEventListener('click', exportTasks);
}

// 设置时长
function setDuration(minutes) {
  currentTime = minutes * 60;
  originalTime = minutes * 60;
  updateTimerDisplay();
}

// 更新倒计时显示
function updateTimerDisplay() {
  const minutes = Math.floor(currentTime / 60);
  const seconds = currentTime % 60;
  timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// 开始倒计时
function startTimer() {
  if (isPaused) {
    // 恢复暂停前的倒计时
    clearInterval(pauseTimerInterval);
    isPaused = false;
    pauseBtn.textContent = '暂停';
  } else {
    // 检查任务信息
    if (!taskName.value.trim()) {
      alert('请输入任务名称');
      return;
    }
    
    // 创建当前任务
    const taskTypeValue = taskType.value === '自定义' ? customTaskType.value.trim() || '其他' : taskType.value;
    currentTask = {
      id: Date.now(),
      name: taskName.value.trim(),
      type: taskTypeValue,
      duration: originalTime / 60,
      status: '进行中',
      createdAt: new Date().toISOString()
    };
  }
  
  if (!isRunning) {
    isRunning = true;
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    
    timerInterval = setInterval(() => {
      if (currentTime > 0) {
        currentTime--;
        updateTimerDisplay();
      } else {
        clearInterval(timerInterval);
        isRunning = false;
        
        if (isBreakTime) {
          // 休息时间结束
          isBreakTime = false;
          alert('休息时间结束！');
          resetTimer();
        } else {
          // 专注时间结束，标记任务为已完成
          completeTask();
          
          // 计算休息时间
          if (originalTime <= 30 * 60) {
            // 30分钟及以内，5分钟休息
            breakDuration = 5 * 60;
          } else {
            // 30分钟以上，15分钟休息
            breakDuration = 15 * 60;
          }
          
          // 开始休息时间
          startBreakTime();
        }
      }
    }, 1000);
  }
}

// 暂停倒计时
function pauseTimer() {
  if (isRunning) {
    // 弹出输入框让用户输入中断原因
    const interruptReason = prompt('请输入中断原因：');
    
    // 如果用户输入了中断原因，则进入暂停倒计时
    if (interruptReason && interruptReason.trim()) {
      // 保存中断原因到当前任务
      if (currentTask) {
        currentTask.interruptReason = interruptReason.trim();
      }
      
      clearInterval(timerInterval);
      isRunning = false;
      isPaused = true;
      pauseBtn.textContent = '恢复';
      startBtn.disabled = false;
      
      // 开始暂停倒计时
      pauseTime = 5 * 60;
      pauseTimerInterval = setInterval(() => {
        if (pauseTime > 0) {
          pauseTime--;
          // 可以在这里显示暂停倒计时，例如在按钮上
          pauseBtn.textContent = `恢复 (${Math.floor(pauseTime / 60)}:${(pauseTime % 60).toString().padStart(2, '0')})`;
        } else {
          // 暂停时间结束，标记任务为未完成
          clearInterval(pauseTimerInterval);
          markTaskAsIncomplete();
          resetTimer();
          alert('暂停时间结束，任务已标记为未完成');
        }
      }, 1000);
    }
    // 否则继续专注倒计时
  }
}

// 重置倒计时
function resetTimer() {
  clearInterval(timerInterval);
  clearInterval(pauseTimerInterval);
  isRunning = false;
  isPaused = false;
  isBreakTime = false;
  currentTime = originalTime;
  pauseBtn.textContent = '暂停';
  startBtn.disabled = false;
  pauseBtn.disabled = false;
  updateTimerDisplay();
}

// 开始休息时间
function startBreakTime() {
  isBreakTime = true;
  currentTime = breakDuration;
  updateTimerDisplay();
  alert(`专注时间结束！开始${breakDuration / 60}分钟休息`);
  
  // 自动开始休息倒计时
  startBtn.click();
}

// 完成任务
function completeTask() {
  if (currentTask) {
    currentTask.status = '已完成';
    currentTask.completedAt = new Date().toISOString();
    saveTask(currentTask);
    renderTaskLists();
    
    // 显示撒花动画
    showConfetti();
  }
}

// 显示撒花动画
function showConfetti() {
  const timerDisplay = document.getElementById('timerDisplay');
  const colors = ['#f00', '#0f0', '#00f', '#ff0', '#f0f', '#0ff'];
  const confettiCount = 50;
  
  // 创建撒花元素
  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.classList.add('confetti');
    
    // 随机颜色
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    
    // 随机位置（在倒计时数字周围）
    const randomX = Math.random() * timerDisplay.offsetWidth - timerDisplay.offsetWidth / 2;
    confetti.style.left = `50%`;
    confetti.style.transform = `translateX(${randomX}px)`;
    
    // 随机大小
    const size = Math.random() * 10 + 5;
    confetti.style.width = `${size}px`;
    confetti.style.height = `${size}px`;
    
    // 随机旋转
    confetti.style.transform += ` rotate(${Math.random() * 360}deg)`;
    
    // 随机动画延迟
    confetti.style.animationDelay = `${Math.random() * 0.5}s`;
    
    // 添加到倒计时显示容器
    timerDisplay.appendChild(confetti);
  }
  
  // 1.5秒后移除撒花元素
  setTimeout(() => {
    const confettiElements = document.querySelectorAll('.confetti');
    confettiElements.forEach(confetti => {
      confetti.remove();
    });
  }, 1500);
}

// 标记任务为未完成
function markTaskAsIncomplete() {
  if (currentTask) {
    currentTask.status = '未完成';
    currentTask.completedAt = new Date().toISOString();
    saveTask(currentTask);
    renderTaskLists();
  }
}

// 保存任务
function saveTask(task) {
  let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  tasks.push(task);
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// 加载数据
function loadData() {
  // 加载临时记录本
  const savedNotes = localStorage.getItem('notes');
  if (savedNotes) {
    notes.value = savedNotes;
  }
  
  // 加载任务类型选项
  const customTypes = JSON.parse(localStorage.getItem('customTaskTypes')) || [];
  customTypes.forEach(type => {
    if (![...taskType.options].some(option => option.value === type)) {
      const option = document.createElement('option');
      option.value = type;
      option.textContent = type;
      taskType.appendChild(option);
    }
  });
  
  // 加载筛选器状态
  const filters = JSON.parse(localStorage.getItem('filters')) || {};
  if (filters.startDate) startDate.value = filters.startDate;
  if (filters.endDate) endDate.value = filters.endDate;
  if (filters.taskType) filterTaskType.value = filters.taskType;
  if (filters.status) filterStatus.value = filters.status;
}

// 保存临时记录本
function saveNotes() {
  localStorage.setItem('notes', notes.value);
}

// 渲染任务列表
function renderTaskLists() {
  const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  
  // 清空列表
  todoList.innerHTML = '';
  completedList.innerHTML = '';
  
  // 分类任务
  const incompleteTasks = tasks.filter(task => task.status === '未完成');
  const completedTasks = tasks.filter(task => task.status === '已完成');
  
  // 渲染未完成任务
  incompleteTasks.forEach(task => {
    const li = document.createElement('li');
    li.textContent = `【${task.type}】${task.name}（${task.duration}min）`;
    todoList.appendChild(li);
  });
  
  // 渲染已完成任务
  completedTasks.forEach(task => {
    const li = document.createElement('li');
    li.textContent = `【${task.type}】${task.name}（${task.duration}min）`;
    completedList.appendChild(li);
  });
}

// 导出任务为CSV
function exportTasks() {
  const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  
  // 应用筛选条件
  let filteredTasks = tasks.filter(task => {
    const taskDate = new Date(task.createdAt).toISOString().split('T')[0];
    
    // 日期范围筛选
    if (startDate.value && taskDate < startDate.value) return false;
    if (endDate.value && taskDate > endDate.value) return false;
    
    // 任务类型筛选
    if (filterTaskType.value && task.type !== filterTaskType.value) return false;
    
    // 状态筛选
    if (filterStatus.value && task.status !== filterStatus.value) return false;
    
    return true;
  });
  
  // 转换为CSV格式
  const csvData = filteredTasks.map(task => {
    return {
      '任务名称': task.name,
      '任务类型': task.type,
      '专注时长（分钟）': task.duration,
      '状态': task.status,
      '创建时间': task.createdAt,
      '完成时间': task.completedAt || ''
    };
  });
  
  // 生成CSV并下载
  const csv = Papa.unparse(csvData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `tasks_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // 保存筛选器状态
  const filters = {
    startDate: startDate.value,
    endDate: endDate.value,
    taskType: filterTaskType.value,
    status: filterStatus.value
  };
  localStorage.setItem('filters', JSON.stringify(filters));
}

// 初始化应用
init();