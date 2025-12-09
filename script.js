// Multi-Agent 管理系统
class MultiAgentManager {
    constructor() {
        this.expandedStates = {}; // 保存展开状态
        this.transferRelations = {}; // 保存转交关系
        this.agents = [
            {
                id: 1,
                name: "理财小助手",
                description: "Agent描述待补充",
                isMain: true,
                avatar: "理",
                model: "DeepSeek-V3",
                transferDescription: "专业理财咨询助手，提供投资建议和财务规划",
                prompt: "你是一个专业的理财顾问，请根据用户的财务状况和风险偏好，提供个性化的投资建议和理财规划。"
            },
            {
                id: 2,
                name: "风险评估师",
                description: "负责《功能》的 Agent，完成《典型场景》的特定任务。",
                isMain: false,
                avatar: "风",
                model: "GPT-4",
                transferDescription: "风险评估专家，分析投资风险和市场波动",
                prompt: "你是一个专业的风险评估师，请帮助用户评估投资风险，分析市场波动和潜在风险因素。"
            },
            {
                id: 3,
                name: "市场数据分析师",
                description: "负责《功能》的 Agent，完成《典型场景》的特定任务。",
                isMain: false,
                avatar: "市",
                model: "Claude-3",
                transferDescription: "市场数据分析专家，提供市场趋势和数据洞察",
                prompt: "你是一个专业的市场数据分析师，请分析市场趋势、提供数据洞察和投资机会分析。"
            },
            {
                id: 4,
                name: "投资组合优化设计师",
                description: "负责《功能》的 Agent，完成《典型场景》的特定任务。",
                isMain: false,
                avatar: "投",
                model: "Gemini-Pro",
                transferDescription: "投资组合优化专家，设计最优投资配置方案",
                prompt: "你是一个专业的投资组合优化设计师，请根据用户的风险偏好和投资目标，设计最优的投资组合配置。"
            }
        ];
        
        this.draggedElement = null;
        this.draggedIndex = -1;
        this.dropZoneIndex = -1;
        
        this.init();
        this.initializeDefaultTransferRelations(); // 初始化默认转交关系
    }

    // 初始化默认转交关系
    initializeDefaultTransferRelations() {
        // 设置符合示例的初始转交关系
        // A(主) -> B,C,D
        // B -> A,C  
        // C -> A,D
        // D -> A
        this.transferRelations = {
            1: [2, 3, 4], // 理财小助手(A) -> 风险评估师(B), 市场数据分析师(C), 投资组合优化设计师(D)
            2: [1, 3],    // 风险评估师(B) -> 理财小助手(A), 市场数据分析师(C)
            3: [4, 1],    // 市场数据分析师(C) -> 投资组合优化设计师(D), 理财小助手(A)
            4: [1]        // 投资组合优化设计师(D) -> 理财小助手(A)
        };
    }

    // 更新转交关系（当主Agent变化时调用）
    updateTransferRelations() {
        const mainAgent = this.agents.find(agent => agent.isMain);
        const subAgents = this.agents.filter(agent => !agent.isMain);
        
        if (mainAgent) {
            // 有主Agent的情况
            
            // 1. 主Agent转交给所有子Agent（强制规则）
            this.transferRelations[mainAgent.id] = subAgents.map(agent => agent.id);
            
            // 2. 处理子Agent的转交关系
            subAgents.forEach(subAgent => {
                if (!this.transferRelations[subAgent.id]) {
                    this.transferRelations[subAgent.id] = [];
                }
                
                // 确保子Agent转交回主Agent（强制规则）
                if (!this.transferRelations[subAgent.id].includes(mainAgent.id)) {
                    this.transferRelations[subAgent.id].push(mainAgent.id);
                }
                
                // 保留子Agent之间的转交关系，但需要清理无效的Agent ID
                this.transferRelations[subAgent.id] = this.transferRelations[subAgent.id].filter(id => 
                    this.agents.some(agent => agent.id === id)
                );
            });
            
        } else {
            // 没有主Agent的情况 - 保留所有现有的转交关系，只清理无效ID
            Object.keys(this.transferRelations).forEach(fromAgentId => {
                const fromAgentIdNum = parseInt(fromAgentId);
                
                // 如果转交方Agent不存在，删除整个转交关系
                if (!this.agents.some(agent => agent.id === fromAgentIdNum)) {
                    delete this.transferRelations[fromAgentId];
                } else {
                    // 清理转交目标中不存在的Agent
                    this.transferRelations[fromAgentId] = this.transferRelations[fromAgentId].filter(id => 
                        this.agents.some(agent => agent.id === id)
                    );
                }
            });
        }
        
        // 确保所有Agent都有转交关系条目（即使是空数组）
        this.agents.forEach(agent => {
            if (!this.transferRelations[agent.id]) {
                this.transferRelations[agent.id] = [];
            }
        });
    }

    // 更新转交关系（根据新规则重新实现）
    updateTransferRelationsWithNewLogic() {
        const currentMainAgent = this.agents.find(agent => agent.isMain);
        const subAgents = this.agents.filter(agent => !agent.isMain);
        
        if (currentMainAgent) {
            // 有主Agent的情况
            
            // 保存原有的转交关系副本
            const originalRelations = JSON.parse(JSON.stringify(this.transferRelations));
            
            // 找出原主Agent（通过分析原转交关系推断）
            let originalMainAgentId = null;
            
            // 推断原主Agent：查找在原关系中转交给所有其他Agent的Agent
            for (const agentId of this.agents.map(a => a.id)) {
                if (agentId === currentMainAgent.id) continue; // 跳过当前主Agent
                
                const targets = originalRelations[agentId] || [];
                const otherAgentIds = this.agents.filter(a => a.id !== agentId).map(a => a.id);
                
                // 检查这个Agent是否转交给所有其他Agent（主Agent的特征）
                if (targets.length === otherAgentIds.length && 
                    otherAgentIds.every(id => targets.includes(id))) {
                    originalMainAgentId = agentId;
                    break;
                }
            }
            
            // 规则1: 主Agent转交给所有子Agent（强制规则）
            this.transferRelations[currentMainAgent.id] = subAgents.map(agent => agent.id);
            
            // 处理子Agent的转交关系
            subAgents.forEach(subAgent => {
                if (!this.transferRelations[subAgent.id]) {
                    this.transferRelations[subAgent.id] = [];
                }
                
                const originalTargets = originalRelations[subAgent.id] || [];
                
                // 清空原有关系，重新构建
                this.transferRelations[subAgent.id] = [];
                
                // 规则1: 确保包含主Agent（强制规则）
                this.transferRelations[subAgent.id].push(currentMainAgent.id);
                
                // 特殊处理原主Agent
                if (subAgent.id === originalMainAgentId) {
                    // 原主Agent现在变成子Agent，保留它原来的转交关系（转交给所有其他Agent）
                    // 但要替换自己为新主Agent
                    const otherAgents = this.agents.filter(a => a.id !== subAgent.id);
                    otherAgents.forEach(otherAgent => {
                        if (!this.transferRelations[subAgent.id].includes(otherAgent.id)) {
                            this.transferRelations[subAgent.id].push(otherAgent.id);
                        }
                    });
                } else {
                    // 其他子Agent的处理
                    // 规则2: 如果原子Agent转交对象只有原主Agent，则在主Agent更换后，子Agent转交对象只有新主Agent
                    if (originalTargets.length === 1 && originalTargets[0] === originalMainAgentId) {
                        // 原来只转交给原主Agent，现在只转交给新主Agent（已经添加了）
                        // 不需要额外操作
                    } else {
                        // 规则3: 在不违背规则1和2的前提下，保留原有的子Agent之间的转交关系
                        originalTargets.forEach(targetId => {
                            // 如果目标Agent仍然存在且不是当前主Agent且不是自己，则保留
                            const targetAgent = this.agents.find(a => a.id === targetId);
                            if (targetAgent && 
                                targetId !== currentMainAgent.id && 
                                targetId !== subAgent.id &&
                                targetId !== originalMainAgentId) {
                                if (!this.transferRelations[subAgent.id].includes(targetId)) {
                                    this.transferRelations[subAgent.id].push(targetId);
                                }
                            }
                        });
                    }
                }
                
                // 清理无效的Agent ID
                this.transferRelations[subAgent.id] = this.transferRelations[subAgent.id].filter(id => 
                    this.agents.some(agent => agent.id === id)
                );
            });
            
        } else {
            // 没有主Agent的情况（主Agent被删除）
            
            // 清理所有无效的Agent ID
            Object.keys(this.transferRelations).forEach(fromAgentId => {
                const fromAgentIdNum = parseInt(fromAgentId);
                
                // 如果转交方Agent不存在，删除整个转交关系
                if (!this.agents.some(agent => agent.id === fromAgentIdNum)) {
                    delete this.transferRelations[fromAgentId];
                } else {
                    // 清理转交目标中不存在的Agent
                    this.transferRelations[fromAgentId] = this.transferRelations[fromAgentId].filter(id => 
                        this.agents.some(agent => agent.id === id)
                    );
                }
            });
        }
        
        // 确保所有Agent都有转交关系条目（即使是空数组）
        this.agents.forEach(agent => {
            if (!this.transferRelations[agent.id]) {
                this.transferRelations[agent.id] = [];
            }
        });
        
        console.log('转交关系已更新:', this.transferRelations);
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
            
            // 恢复展开状态
            if (this.expandedStates[agent.id]) {
                agentCard.classList.add('expanded');
                const expandBtn = agentCard.querySelector('.expand-btn');
                if (expandBtn) {
                    expandBtn.classList.add('expanded');
                }
            }
            
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
            <div class="agent-header" onclick="toggleAgentExpand(${index}, event)">>
                <div class="agent-info">
                    <div class="agent-avatar">${agent.avatar}</div>
                    <div class="agent-details">
                        <h3>${agent.name}</h3>
                        <p>${agent.description}</p>
                    </div>
                </div>
                <div class="agent-actions">
                    <button class="expand-btn">▼</button>
                    <div class="agent-menu">
                        <button class="menu-button" onclick="event.stopPropagation(); toggleMenu(${index})">⋯</button>
                        <div class="dropdown-menu" id="menu-${index}">
                            ${this.getMenuItems(agent, index)}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="agent-expanded-content">
                <!-- 模型配置 -->
                <div class="config-group">
                    <div class="config-label">
                        模型 <span class="help-icon">?</span>
                    </div>
                    <select class="model-select" onchange="updateAgentModel(${index}, this.value)">
                        <option value="DeepSeek-V3" ${agent.model === 'DeepSeek-V3' ? 'selected' : ''}>DeepSeek-V3 128K</option>
                        <option value="GPT-4" ${agent.model === 'GPT-4' ? 'selected' : ''}>GPT-4 Turbo</option>
                        <option value="Claude-3" ${agent.model === 'Claude-3' ? 'selected' : ''}>Claude-3 Sonnet</option>
                        <option value="Gemini-Pro" ${agent.model === 'Gemini-Pro' ? 'selected' : ''}>Gemini Pro</option>
                    </select>
                </div>
                
                <!-- 转交描述 -->
                <div class="config-group">
                    <div class="config-label">
                        转交描述 <span class="help-icon">?</span>
                    </div>
                    <textarea class="description-input" 
                              placeholder="请输入主Agent描述" 
                              maxlength="200"
                              oninput="updateCharCount(this, ${index})">${agent.transferDescription || ''}</textarea>
                    <div class="char-count" id="char-count-${index}">${(agent.transferDescription || '').length}/200</div>
                    <div class="error-text" style="display: none;">请输入Agent描述内容</div>
                </div>
                
                <!-- 提示词 -->
                <div class="config-group">
                    <div class="prompt-section">
                        <div class="prompt-header">
                            <div class="config-label">
                                提示词 <span class="help-icon">?</span>
                            </div>
                            <div class="prompt-actions">
                                <button class="prompt-btn" onclick="useTemplate(${index})">模板</button>
                                <button class="prompt-btn ai" onclick="optimizePrompt(${index})">AI一键优化</button>
                            </div>
                        </div>
                        <textarea class="prompt-textarea" 
                                  placeholder="根据用户输入的内容调用"
                                  oninput="updatePromptCount(this, ${index})">${agent.prompt || '根据用户输入的内容调用\n\n🔧 Hunyuan 3D Global (Professional)/SubmitHunyuanTo3DProJob 生成JobId，返回给用户'}</textarea>
                        <div class="prompt-footer">
                            <span>⋯⋯</span>
                            <span id="prompt-count-${index}">${(agent.prompt || '根据用户输入的内容调用\n\n🔧 Hunyuan 3D Global (Professional)/SubmitHunyuanTo3DProJob 生成JobId，返回给用户').length}/20000</span>
                        </div>
                    </div>
                </div>
                
                <!-- 插件 -->
                <div class="plugin-section">
                    <div class="plugin-header">
                        <div class="config-label">插件</div>
                        <button class="add-plugin-btn" onclick="addPlugin(${index})">
                            ➕ 添加
                        </button>
                    </div>
                    <div class="plugin-item">
                        <div class="plugin-icon">🔧</div>
                        <div class="plugin-info">
                            <div class="plugin-name">Hunyuan 3D Global (Professional)/SubmitHunyu...</div>
                            <div class="plugin-desc">Submit a Hunyuan 3D job to generate a JobId based on the in...</div>
                        </div>
                        <button class="plugin-menu" onclick="togglePluginMenu(${index})">⋯</button>
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
            // 只允许从卡片头部开始拖拽
            if (!e.target.closest('.agent-header') && !e.target.classList.contains('agent-card')) {
                e.preventDefault();
                return;
            }
            
            this.draggedElement = card;
            this.draggedIndex = index;
            card.classList.add('dragging');
            
            // 在拖拽时暂时禁用展开内容的交互
            const expandedContent = card.querySelector('.agent-expanded-content');
            if (expandedContent) {
                expandedContent.style.pointerEvents = 'none';
            }
            
            // 设置拖拽数据
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', card.outerHTML);
        });

        card.addEventListener('dragend', (e) => {
            card.classList.remove('dragging');
            this.clearDragStyles();
            
            // 恢复展开内容的交互
            const expandedContent = card.querySelector('.agent-expanded-content');
            if (expandedContent) {
                expandedContent.style.pointerEvents = 'auto';
            }
            
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
        
        // 更新转交关系
        this.updateTransferRelationsWithNewLogic();
        
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
            
            // 删除该Agent的转交关系
            delete this.transferRelations[agent.id];
            
            // 从其他Agent的转交关系中移除该Agent
            Object.keys(this.transferRelations).forEach(fromAgentId => {
                this.transferRelations[fromAgentId] = this.transferRelations[fromAgentId].filter(id => id !== agent.id);
            });
            
            // 如果删除的是主Agent，清除主Agent标记，不自动设置新的主Agent
            if (isMainAgent && this.agents.length > 0) {
                // 不自动设置新的主Agent，让用户手动选择
                // this.agents[0].isMain = true;
            }
            
            // 更新转交关系
            this.updateTransferRelationsWithNewLogic();
            
            this.render();
            
            if (isMainAgent) {
                this.showNotification('主 Agent 已删除，转交关系已更新。', 'warning');
            }
        }
    }

    addAgent() {
        const newId = Math.max(...this.agents.map(a => a.id)) + 1;
        const newAgent = {
            id: newId,
            name: `新 Agent ${newId}`,
            description: "Agent描述待补充",
            isMain: this.agents.length === 0, // 如果没有Agent，新建的就是主Agent
            avatar: "新",
            model: "DeepSeek-V3",
            transferDescription: "",
            prompt: "根据用户输入的内容调用\n\n🔧 Hunyuan 3D Global (Professional)/SubmitHunyuanTo3DProJob 生成JobId，返回给用户"
        };
        
        this.agents.push(newAgent);
        
        // 更新转交关系
        this.updateTransferRelationsWithNewLogic();
        
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

// Agent展开功能
function toggleAgentExpand(index, event) {
    // 如果正在拖拽，不执行展开操作
    if (event && event.target.closest('.agent-card').classList.contains('dragging')) {
        return;
    }
    
    console.log('toggleAgentExpand called with index:', index);
    const card = document.querySelector(`[data-index="${index}"]`);
    const expandBtn = card.querySelector('.expand-btn');
    const agent = agentManager.agents[index];
    
    console.log('Found card:', card);
    console.log('Found expandBtn:', expandBtn);
    console.log('Agent:', agent);
    
    card.classList.toggle('expanded');
    expandBtn.classList.toggle('expanded');
    
    // 保存展开状态
    agentManager.expandedStates[agent.id] = card.classList.contains('expanded');
    console.log('Expanded states:', agentManager.expandedStates);
}

// 更新字符计数
function updateCharCount(textarea, index) {
    const charCount = document.getElementById(`char-count-${index}`);
    const currentLength = textarea.value.length;
    charCount.textContent = `${currentLength}/200`;
    
    // 更新Agent数据
    if (agentManager && agentManager.agents[index]) {
        agentManager.agents[index].transferDescription = textarea.value;
    }
}

// 更新提示词计数
function updatePromptCount(textarea, index) {
    const promptCount = document.getElementById(`prompt-count-${index}`);
    const currentLength = textarea.value.length;
    promptCount.textContent = `${currentLength}/20000`;
    
    // 更新Agent数据
    if (agentManager && agentManager.agents[index]) {
        agentManager.agents[index].prompt = textarea.value;
    }
}

// 更新Agent模型
function updateAgentModel(index, model) {
    if (agentManager && agentManager.agents[index]) {
        agentManager.agents[index].model = model;
    }
}

// 使用模板
function useTemplate(index) {
    const textarea = document.querySelector(`[data-index="${index}"] .prompt-textarea`);
    const templates = [
        "你是一个专业的AI助手，请根据用户的需求提供准确、有用的回答。",
        "作为一个客服代表，请友好、耐心地回答用户的问题。",
        "你是一个技术专家，请提供详细的技术解决方案。"
    ];
    
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    textarea.value = randomTemplate;
    updatePromptCount(textarea, index);
}

// AI优化提示词
function optimizePrompt(index) {
    const textarea = document.querySelector(`[data-index="${index}"] .prompt-textarea`);
    const currentPrompt = textarea.value;
    
    // 模拟AI优化
    const optimizedPrompt = `${currentPrompt}\n\n[AI优化建议]\n- 请保持回答的准确性和相关性\n- 使用清晰、简洁的语言\n- 根据上下文调整回答风格`;
    
    textarea.value = optimizedPrompt;
    updatePromptCount(textarea, index);
}

// 添加插件
function addPlugin(index) {
    alert(`为 Agent ${index + 1} 添加插件功能`);
}

// 插件菜单
function togglePluginMenu(index) {
    alert(`插件菜单 - Agent ${index + 1}`);
}

// 转交关系设置
function openTransferSettings() {
    // 在打开转交关系设置前，确保转交关系是最新的
    agentManager.updateTransferRelationsWithNewLogic();
    
    const modal = document.getElementById('transferModal');
    modal.classList.add('show');
    renderTransferRelations();
    
    // 调试输出
    console.log('=== 打开转交关系设置 ===');
    debugTransferRelations();
}

function closeTransferModal() {
    const modal = document.getElementById('transferModal');
    modal.classList.remove('show');
}

function renderTransferRelations() {
    const container = document.getElementById('transferRelations');
    container.innerHTML = '';
    
    // 重新排序agents，主Agent显示在第一位
    const mainAgent = agentManager.agents.find(agent => agent.isMain);
    const subAgents = agentManager.agents.filter(agent => !agent.isMain);
    const orderedAgents = mainAgent ? [mainAgent, ...subAgents] : agentManager.agents;
    
    orderedAgents.forEach((agent, displayIndex) => {
        const row = document.createElement('div');
        row.className = 'transfer-row';
        
        // 获取当前Agent的转交目标
        const currentTargets = agentManager.transferRelations[agent.id] || [];
        
        // 生成显示文本
        let displayText = '选择接收方Agent';
        if (currentTargets.length > 0) {
            const targetNumbers = currentTargets.map(targetId => {
                // 在显示编号时，主Agent显示为01，其他按新顺序显示
                if (mainAgent && targetId === mainAgent.id) {
                    return '1';
                } else {
                    const targetAgent = agentManager.agents.find(a => a.id === targetId);
                    if (targetAgent && !targetAgent.isMain) {
                        const subIndex = subAgents.findIndex(a => a.id === targetId);
                        return (subIndex + 2).toString(); // 从2开始编号
                    }
                }
                return '';
            }).filter(num => num);
            
            displayText = targetNumbers.join(', ');
        }
        
        // 显示编号：主Agent显示为01，其他按顺序显示
        let displayNumber;
        if (agent.isMain) {
            displayNumber = '01';
        } else {
            const subIndex = subAgents.findIndex(a => a.id === agent.id);
            displayNumber = String(subIndex + 2).padStart(2, '0');
        }
        
        row.innerHTML = `
            <div class="transfer-from">
                <div class="transfer-agent-name">${agent.name}</div>
                <div class="transfer-agent-id">${displayNumber}</div>
            </div>
            <div class="transfer-arrow">→</div>
            <div class="transfer-to">
                <div class="transfer-select-wrapper">
                    <div class="transfer-select" onclick="toggleTransferDropdown(${agent.id})" data-agent-id="${agent.id}">
                        ${displayText}
                    </div>
                    <div class="transfer-dropdown" id="dropdown-${agent.id}">
                        ${orderedAgents
                            .filter(a => a.id !== agent.id)
                            .map((a) => {
                                const isSelected = currentTargets.includes(a.id);
                                // 显示编号：主Agent显示为1，其他按顺序显示
                                let optionNumber;
                                if (a.isMain) {
                                    optionNumber = '1';
                                } else {
                                    const subIndex = subAgents.findIndex(sub => sub.id === a.id);
                                    optionNumber = (subIndex + 2).toString();
                                }
                                return `
                                    <div class="transfer-option ${isSelected ? 'selected' : ''}" 
                                         onclick="toggleTransferOption(${agent.id}, ${a.id})">
                                        <div class="transfer-checkbox">${isSelected ? '✓' : ''}</div>
                                        <span>${optionNumber}. ${a.name}</span>
                                    </div>
                                `;
                            }).join('')}
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(row);
    });
}

function toggleTransferDropdown(agentId) {
    // 关闭其他下拉框
    document.querySelectorAll('.transfer-dropdown').forEach(dropdown => {
        if (dropdown.id !== `dropdown-${agentId}`) {
            dropdown.classList.remove('show');
        }
    });
    
    // 切换当前下拉框
    const dropdown = document.getElementById(`dropdown-${agentId}`);
    dropdown.classList.toggle('show');
}

function toggleTransferOption(fromAgentId, toAgentId) {
    if (!agentManager.transferRelations[fromAgentId]) {
        agentManager.transferRelations[fromAgentId] = [];
    }
    
    const targets = agentManager.transferRelations[fromAgentId];
    const index = targets.indexOf(toAgentId);
    
    if (index > -1) {
        targets.splice(index, 1);
    } else {
        targets.push(toAgentId);
    }
    
    // 重新渲染以更新显示
    renderTransferRelations();
}

function updateTransferRelation(fromAgentId, selectElement) {
    // 这个函数现在不需要了，因为我们使用自定义下拉框
}

function saveTransferSettings() {
    // 保存用户的自定义设置
    console.log('保存转交关系:', agentManager.transferRelations);
    
    // 在保存后，确保仍然遵循主Agent规则
    agentManager.updateTransferRelationsWithNewLogic();
    
    // 显示保存成功的提示
    alert('转交关系设置已保存，并已确保符合主Agent规则');
    closeTransferModal();
}

// 调试函数：打印当前转交关系
function debugTransferRelations() {
    console.log('=== 当前转交关系 ===');
    agentManager.agents.forEach((agent, index) => {
        const targets = agentManager.transferRelations[agent.id] || [];
        const targetNames = targets.map(id => {
            const targetAgent = agentManager.agents.find(a => a.id === id);
            return targetAgent ? targetAgent.name : `Agent${id}`;
        });
        console.log(`${agent.name}${agent.isMain ? '(主)' : ''} -> ${targetNames.join(', ')}`);
    });
    console.log('==================');
}

// 点击模态框外部关闭
document.addEventListener('click', function(e) {
    const modal = document.getElementById('transferModal');
    if (e.target === modal) {
        closeTransferModal();
    }
    
    // 点击外部关闭下拉框
    if (!e.target.closest('.transfer-select-wrapper')) {
        document.querySelectorAll('.transfer-dropdown').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
    }
});

// 测试任务轮询功能
async function testTaskPolling() {
    addMessage('开始测试任务轮询功能...', 'bot');
    
    // 模拟任务创建和轮询
    const taskChecker = new TaskStatusChecker();
    
    // 模拟一个任务ID
    const mockJobID = 'test_task_' + Date.now();
    
    addMessage(`模拟任务已创建，任务ID: ${mockJobID}`, 'bot');
    addMessage('开始轮询任务状态...', 'bot');
    
    // 由于这是演示，我们创建一个模拟的轮询函数
    await simulateTaskPolling(mockJobID);
}

// 模拟任务轮询（用于演示）
async function simulateTaskPolling(jobID) {
    let attempts = 0;
    const maxAttempts = 5;
    
    while (attempts < maxAttempts) {
        attempts++;
        addMessage(`第 ${attempts} 次查询任务状态...`, 'bot');
        
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // 模拟不同的任务状态
        if (attempts < 3) {
            addMessage('任务状态: processing（处理中）', 'bot');
        } else if (attempts === 3) {
            addMessage('任务状态: processing（处理中，即将完成）', 'bot');
        } else {
            // 模拟任务完成
            const mockUrl = `https://example.com/results/${jobID}.pdf`;
            addMessage(`任务完成！生成的URL: <a href="${mockUrl}" target="_blank">${mockUrl}</a>`, 'bot');
            addMessage('✅ 任务轮询测试完成', 'bot');
            return;
        }
    }
}

// 任务状态查询功能
class TaskStatusChecker {
    constructor() {
        this.checkInterval = 2000; // 2秒查询一次
        this.maxRetries = 30; // 最多重试30次（1分钟）
    }

    // 模拟API调用查询任务状态
    async checkTaskStatus(jobID) {
        try {
            // 这里模拟API调用，实际使用时替换为真实的API端点
            const response = await fetch(`/api/tasks/${jobID}/status`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('查询任务状态失败:', error);
            throw error;
        }
    }

    // 使用while循环轮询任务状态
    async pollTaskStatus(jobID) {
        let retryCount = 0;
        let taskCompleted = false;
        let taskResult = null;

        console.log(`开始查询任务状态，任务ID: ${jobID}`);

        while (!taskCompleted && retryCount < this.maxRetries) {
            try {
                console.log(`第 ${retryCount + 1} 次查询任务状态...`);
                
                const statusData = await this.checkTaskStatus(jobID);
                
                // 检查任务状态
                if (statusData.status === 'completed' && statusData.url) {
                    taskCompleted = true;
                    taskResult = {
                        success: true,
                        url: statusData.url,
                        message: '任务生成成功',
                        data: statusData
                    };
                    console.log('任务完成，获取到URL:', statusData.url);
                } else if (statusData.status === 'failed') {
                    taskCompleted = true;
                    taskResult = {
                        success: false,
                        error: statusData.error || '任务执行失败',
                        message: '任务生成失败'
                    };
                    console.log('任务失败:', statusData.error);
                } else if (statusData.status === 'processing' || statusData.status === 'pending') {
                    // 任务仍在处理中，继续等待
                    console.log(`任务状态: ${statusData.status}，继续等待...`);
                    retryCount++;
                    
                    // 等待指定时间后再次查询
                    await this.sleep(this.checkInterval);
                } else {
                    // 未知状态
                    console.warn('未知任务状态:', statusData.status);
                    retryCount++;
                    await this.sleep(this.checkInterval);
                }
                
            } catch (error) {
                console.error(`查询失败 (第${retryCount + 1}次):`, error);
                retryCount++;
                
                if (retryCount < this.maxRetries) {
                    console.log(`等待 ${this.checkInterval/1000} 秒后重试...`);
                    await this.sleep(this.checkInterval);
                } else {
                    taskResult = {
                        success: false,
                        error: error.message,
                        message: '查询任务状态超时或失败'
                    };
                }
            }
        }

        // 如果超过最大重试次数仍未完成
        if (!taskCompleted && retryCount >= this.maxRetries) {
            taskResult = {
                success: false,
                error: '查询超时',
                message: `任务查询超时，已重试 ${this.maxRetries} 次`
            };
        }

        return taskResult;
    }

    // 辅助方法：延时等待
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 启动任务并轮询状态的完整流程
    async startTaskAndPoll(taskParams) {
        try {
            console.log('开始创建任务...');
            
            // 1. 创建任务
            const createResponse = await fetch('/api/tasks/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(taskParams)
            });

            if (!createResponse.ok) {
                throw new Error(`创建任务失败: ${createResponse.status}`);
            }

            const createData = await createResponse.json();
            const jobID = createData.jobID;

            if (!jobID) {
                throw new Error('未获取到任务ID');
            }

            console.log('任务创建成功，任务ID:', jobID);

            // 2. 开始轮询任务状态
            const result = await this.pollTaskStatus(jobID);
            
            return result;

        } catch (error) {
            console.error('任务处理失败:', error);
            return {
                success: false,
                error: error.message,
                message: '任务创建或处理失败'
            };
        }
    }
}

// 使用示例
async function exampleUsage() {
    const taskChecker = new TaskStatusChecker();
    
    // 示例1: 直接查询已知任务ID的状态
    const jobID = 'task_12345';
    const result = await taskChecker.pollTaskStatus(jobID);
    
    if (result.success) {
        console.log('任务完成！URL:', result.url);
        // 在这里处理成功的结果
        showTaskResult(result.url);
    } else {
        console.error('任务失败:', result.message);
        // 在这里处理失败的情况
        showTaskError(result.error);
    }
}

// 示例2: 创建任务并轮询状态的完整流程
async function createAndMonitorTask() {
    const taskChecker = new TaskStatusChecker();
    
    const taskParams = {
        type: 'document_generation',
        content: 'sample content',
        format: 'pdf'
    };
    
    const result = await taskChecker.startTaskAndPoll(taskParams);
    
    if (result.success) {
        console.log('任务完成！URL:', result.url);
        // 可以在这里下载文件或显示结果
        window.open(result.url, '_blank');
    } else {
        console.error('任务失败:', result.message);
        alert('任务处理失败: ' + result.message);
    }
}

// 显示任务结果的辅助函数
function showTaskResult(url) {
    // 在页面中显示成功消息
    const message = `任务生成成功！<a href="${url}" target="_blank">点击查看结果</a>`;
    addMessage(message, 'bot');
}

function showTaskError(error) {
    // 在页面中显示错误消息
    const message = `任务处理失败: ${error}`;
    addMessage(message, 'bot');
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
