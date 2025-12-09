// Multi-Agent 管理系统
class MultiAgentManager {
    constructor() {
        this.agents = [
            {
                id: 1,
                name: "理财小助手",
                description: "Agent描述待补充",
                isMain: true,
                avatar: "理"
            },
            {
                id: 2,
                name: "风险评估师",
                description: "负责《功能》的 Agent，完成《典型场景》的特定任务。",
                isMain: false,
                avatar: "风"
            },
            {
                id: 3,
                name: "市场数据分析师",
                description: "负责《功能》的 Agent，完成《典型场景》的特定任务。",
                isMain: false,
                avatar: "市"
            },
            {
                id: 4,
                name: "投资组合优化设计师",
                description: "负责《功能》的 Agent，完成《典型场景》的特定任务。",
                isMain: false,
                avatar: "投"
            }
        ];
        
        this.draggedElement = null;
        this.draggedIndex = -1;
        this.dropZoneIndex = -1;
        
        this.init();
    }

    init() {
        this.render();
        this.bindEvents();
    }

    render() {
        const container = document.getElementById('agentsContainer');
        container.innerHTML = '';

        this.agents.forEach((agent, index) => {
            const agentCard = this.createAgentCard(agent, index);
            container.appendChild(agentCard);
            
            // 添加拖拽占位符
            if (index < this.agents.length - 1) {
                const placeholder = document.createElement('div');
                placeholder.className = 'drag-placeholder';
                placeholder.dataset.index = index + 1;
                container.appendChild(placeholder);
            }
        });
    }

    createAgentCard(agent, index) {
        const card = document.createElement('div');
        card.className = `agent-card ${agent.isMain ? 'main-agent' : ''}`;
        card.draggable = true;
        card.dataset.index = index;
        card.dataset.agentId = agent.id;

        card.innerHTML = `
            <div class="agent-header">
                <div class="agent-info">
                    <div class="agent-avatar">${agent.avatar}</div>
                    <div class="agent-details">
                        <h3>${agent.name}</h3>
                        <p>${agent.description}</p>
                    </div>
                </div>
                <div class="agent-menu">
                    <button class="menu-button" onclick="toggleMenu(${index})">⋯</button>
                    <div class="dropdown-menu" id="menu-${index}">
                        ${this.getMenuItems(agent, index)}
                    </div>
                </div>
            </div>
        `;

        // 绑定拖拽事件
        this.bindDragEvents(card, index);

        return card;
    }

    getMenuItems(agent, index) {
        if (agent.isMain) {
            return `
                <div class="dropdown-item" onclick="openAdvancedSettings(${index})">高级设置</div>
                <div class="dropdown-item danger" onclick="deleteAgent(${index})">删除</div>
            `;
        } else {
            return `
                <div class="dropdown-item primary" onclick="setAsMainAgent(${index})">设置为主 Agent</div>
                <div class="dropdown-item" onclick="openAdvancedSettings(${index})">高级设置</div>
                <div class="dropdown-item danger" onclick="deleteAgent(${index})">删除</div>
            `;
        }
    }

    bindEvents() {
        // 点击其他地方关闭菜单
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.agent-menu')) {
                this.closeAllMenus();
            }
        });
    }

    bindDragEvents(card, index) {
        card.addEventListener('dragstart', (e) => {
            this.draggedElement = card;
            this.draggedIndex = index;
            card.classList.add('dragging');
            
            // 设置拖拽数据
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', card.outerHTML);
        });

        card.addEventListener('dragend', (e) => {
            card.classList.remove('dragging');
            this.clearDragStyles();
            this.draggedElement = null;
            this.draggedIndex = -1;
        });

        card.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const rect = card.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            const dropIndex = e.clientY < midY ? index : index + 1;
            
            this.showDropIndicator(dropIndex);
        });

        card.addEventListener('drop', (e) => {
            e.preventDefault();
            
            if (this.draggedIndex === -1) return;
            
            const rect = card.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            let dropIndex = e.clientY < midY ? index : index + 1;
            
            // 调整索引
            if (this.draggedIndex < dropIndex) {
                dropIndex--;
            }
            
            this.moveAgent(this.draggedIndex, dropIndex);
        });
    }

    showDropIndicator(index) {
        this.clearDragStyles();
        const placeholders = document.querySelectorAll('.drag-placeholder');
        
        if (index === 0) {
            // 移动到第一位
            const firstCard = document.querySelector('.agent-card');
            if (firstCard) {
                firstCard.style.borderTop = '4px solid #4285f4';
            }
        } else if (index <= placeholders.length) {
            const placeholder = placeholders[index - 1];
            if (placeholder) {
                placeholder.classList.add('show');
            }
        }
    }

    clearDragStyles() {
        document.querySelectorAll('.drag-placeholder').forEach(p => {
            p.classList.remove('show');
        });
        document.querySelectorAll('.agent-card').forEach(card => {
            card.style.borderTop = '';
            card.classList.remove('drag-over');
        });
    }

    moveAgent(fromIndex, toIndex) {
        if (fromIndex === toIndex) return;

        const movedAgent = this.agents.splice(fromIndex, 1)[0];
        this.agents.splice(toIndex, 0, movedAgent);

        // 如果移动到第一位，设置为主Agent
        if (toIndex === 0 && !movedAgent.isMain) {
            this.setMainAgent(0);
            this.showNotification('主 Agent 已更换，请重新检查转交关系设置。', 'warning');
        } else {
            this.render();
        }
    }

    setMainAgent(index) {
        // 清除所有主Agent标记
        this.agents.forEach(agent => agent.isMain = false);
        
        // 设置新的主Agent
        this.agents[index].isMain = true;
        
        // 如果不在第一位，移动到第一位
        if (index !== 0) {
            const mainAgent = this.agents.splice(index, 1)[0];
            this.agents.unshift(mainAgent);
        }
        
        this.render();
        this.showNotification('主 Agent 已更换，请重新检查转交关系设置。', 'warning');
    }

    deleteAgent(index) {
        const agent = this.agents[index];
        const isMainAgent = agent.isMain;
        
        if (confirm(`确定要删除 "${agent.name}" 吗？`)) {
            this.agents.splice(index, 1);
            
            // 如果删除的是主Agent，设置第一个为主Agent
            if (isMainAgent && this.agents.length > 0) {
                this.agents[0].isMain = true;
                this.showNotification('主 Agent 已更换，请重新检查转交关系设置。', 'warning');
            }
            
            this.render();
        }
    }

    addAgent() {
        const newId = Math.max(...this.agents.map(a => a.id)) + 1;
        const newAgent = {
            id: newId,
            name: `新 Agent ${newId}`,
            description: "Agent描述待补充",
            isMain: this.agents.length === 0, // 如果没有Agent，新建的就是主Agent
            avatar: "新"
        };
        
        this.agents.push(newAgent);
        this.render();
        this.showNotification('新 Agent 已添加');
    }

    showNotification(message, type = 'info') {
        // 只更新页面顶部的提示
        const notice = document.querySelector('.main-agent-notice');
        if (type === 'warning' && message.includes('主 Agent')) {
            notice.style.display = 'flex';
            notice.querySelector('.notice-content span').textContent = message;
        }
    }

    closeAllMenus() {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.classList.remove('show');
        });
    }
}

// 全局函数
let agentManager;

document.addEventListener('DOMContentLoaded', () => {
    agentManager = new MultiAgentManager();
    
    // 初始化时隐藏提示
    const notice = document.querySelector('.main-agent-notice');
    if (notice) {
        notice.style.display = 'none';
    }
});

function toggleMenu(index) {
    agentManager.closeAllMenus();
    const menu = document.getElementById(`menu-${index}`);
    menu.classList.toggle('show');
}

function setAsMainAgent(index) {
    agentManager.setMainAgent(index);
    agentManager.closeAllMenus();
}

function deleteAgent(index) {
    agentManager.deleteAgent(index);
    agentManager.closeAllMenus();
}

function openAdvancedSettings(index) {
    const agent = agentManager.agents[index];
    alert(`打开 "${agent.name}" 的高级设置`);
    agentManager.closeAllMenus();
}

function addNewAgent() {
    agentManager.addAgent();
}

function closeMainNotice() {
    const notice = document.querySelector('.main-agent-notice');
    notice.style.display = 'none';
}

function toggleConfigSection(sectionName) {
    const section = document.querySelector(`#${sectionName}-content`).closest('.config-section');
    const isExpanded = section.classList.contains('expanded');
    
    // 关闭所有其他展开的配置项
    document.querySelectorAll('.config-section.expanded').forEach(s => {
        if (s !== section) {
            s.classList.remove('expanded');
        }
    });
    
    // 切换当前配置项
    if (isExpanded) {
        section.classList.remove('expanded');
    } else {
        section.classList.add('expanded');
    }
}

// 对话调试功能
function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // 添加用户消息
    addMessage(message, 'user');
    input.value = '';
    adjustTextareaHeight(input);
    
    // 显示输入指示器
    showTypingIndicator();
    
    // 模拟AI回复
    setTimeout(() => {
        hideTypingIndicator();
        const responses = [
            '我理解您的需求，让我为您分析一下...',
            '根据您的情况，我建议您考虑以下几个方面：',
            '这是一个很好的问题，让我转交给专业的分析师为您详细解答。',
            '基于当前市场情况，我为您推荐以下理财方案...',
            '您的风险偏好如何？这将影响我为您推荐的投资策略。'
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        addMessage(randomResponse, 'bot');
    }, 1500);
}

function addMessage(content, type) {
    const messagesContainer = document.getElementById('chatMessages');
    
    // 如果是第一条消息，清空空状态并添加has-messages类
    if (messagesContainer.querySelector('.chat-empty-state')) {
        messagesContainer.innerHTML = '';
        messagesContainer.classList.add('has-messages');
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    const avatar = type === 'user' ? '用' : 'AI';
    const avatarClass = type === 'user' ? 'user' : 'bot';
    
    messageDiv.innerHTML = `
        <div class="message-avatar ${avatarClass}">${avatar}</div>
        <div class="message-content">${content}</div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    indicator.style.display = 'flex';
    
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    indicator.style.display = 'none';
}

function clearChat() {
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.classList.remove('has-messages');
    messagesContainer.innerHTML = `
        <div class="chat-empty-state">
            <div class="chat-empty-icon">💬</div>
            <div class="chat-empty-title">AI客服帮助您手动测试02</div>
        </div>
    `;
}

function startDebug() {
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.classList.remove('has-messages');
    messagesContainer.innerHTML = `
        <div class="chat-empty-state">
            <div class="chat-empty-icon">💬</div>
            <div class="chat-empty-title">AI客服帮助您手动测试02</div>
        </div>
    `;
    addMessage('调试模式已启动，您可以开始测试对话了。', 'bot');
}

function handleInputKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

function adjustTextareaHeight(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

// 触摸设备支持
let touchStartY = 0;
let touchStartX = 0;
let longPressTimer = null;
let isDragging = false;

document.addEventListener('touchstart', (e) => {
    const card = e.target.closest('.agent-card');
    if (!card) return;
    
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
    
    longPressTimer = setTimeout(() => {
        isDragging = true;
        card.classList.add('dragging');
        navigator.vibrate && navigator.vibrate(50); // 触觉反馈
    }, 500);
});

document.addEventListener('touchmove', (e) => {
    if (longPressTimer) {
        const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
        const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
        
        if (deltaY > 10 || deltaX > 10) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    }
    
    if (isDragging) {
        e.preventDefault();
        // 处理拖拽移动
    }
});

document.addEventListener('touchend', (e) => {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
    
    if (isDragging) {
        isDragging = false;
        document.querySelectorAll('.agent-card').forEach(card => {
            card.classList.remove('dragging');
        });
    }
});
