// shared.js

const THEME_PORTAL_KEY = 'roadmap-theme-portal';

// Theme management
window.toggleTheme = function() {
    // Portal theme toggling
    if (!window.roadmapConfig) {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem(THEME_PORTAL_KEY, newTheme);
        window.updateThemeToggleButton(newTheme);
        return;
    }
    
    // Roadmap theme toggling
    const themeKey = window.roadmapConfig.themeKey;
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(themeKey, newTheme);
    window.updateThemeToggleButton(newTheme);
};

window.updateThemeToggleButton = function(theme) {
    const icon = document.getElementById('theme-toggle-icon');
    if (!icon) return;
    if (theme === 'dark') {
        icon.textContent = '☀️';
    } else {
        icon.textContent = '🌙';
    }
};

// Clipboard helper
window.copyPrompt = function(button, preId) {
    const pre = document.getElementById(preId);
    if (!pre) return;
    const text = pre.textContent;
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.innerHTML;
        button.innerHTML = '✨ Copied!';
        button.style.borderColor = 'var(--success)';
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.borderColor = '';
        }, 2000);
    });
};

// Card toggling (Accordion)
window.toggleCard = function(cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;
    card.classList.toggle('open');
};

// Toggle all tasks in a card when master checkbox is checked
window.toggleEntireNode = function(cardId, masterCheckbox) {
    const card = document.getElementById(cardId);
    if (!card) return;
    const checkboxes = card.querySelectorAll('.task-list input[type="checkbox"]');
    
    checkboxes.forEach(cb => {
        cb.checked = masterCheckbox.checked;
        localStorage.setItem(cb.id, cb.checked);
    });
    
    window.updateCardProgress(cardId);
    window.recalculateAllProgress();
};

// Handle checking of a single task checkbox
window.onTaskChange = function(cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;
    const checkboxes = card.querySelectorAll('.task-list input[type="checkbox"]');
    
    // Save to localStorage
    checkboxes.forEach(cb => {
        localStorage.setItem(cb.id, cb.checked);
    });
    
    window.updateCardProgress(cardId);
    window.recalculateAllProgress();
};

// Update card progress indicator and checked status
window.updateCardProgress = function(cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;
    const checkboxes = card.querySelectorAll('.task-list input[type="checkbox"]');
    const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
    const totalCount = checkboxes.length;
    
    // Update label text
    const textEl = document.getElementById(`progress-text-${cardId.replace('card-', '')}`);
    if (textEl) {
        textEl.textContent = `${checkedCount}/${totalCount} Tasks`;
    }
    
    // Update node's master checkbox
    const masterCb = document.getElementById(`check-node-${cardId.replace('card-', '')}`);
    if (masterCb) {
        masterCb.checked = (checkedCount === totalCount && totalCount > 0);
    }
};

// Toggle locking dependencies
window.toggleDependencyLocking = function() {
    if (!window.roadmapConfig) return;
    
    const lockKey = window.roadmapConfig.themeKey + '-locks-enabled';
    let locksEnabled = localStorage.getItem(lockKey) !== 'false';
    locksEnabled = !locksEnabled;
    localStorage.setItem(lockKey, locksEnabled);
    
    // Update button text / icons
    const lockBtnLabel = document.getElementById('lock-toggle-label');
    const lockBtnIcon = document.getElementById('lock-toggle-icon');
    if (lockBtnLabel) lockBtnLabel.textContent = locksEnabled ? 'Locks Enabled' : 'Locks Disabled';
    if (lockBtnIcon) lockBtnIcon.textContent = locksEnabled ? '🔒' : '🔓';
    
    window.recalculateAllProgress();
};

// Scroll to page section
window.scrollToStage = function(stageId) {
    const el = document.getElementById(stageId);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

// Focus single lane in parallel track layouts
window.focusTrack = function(trackLaneId) {
    const lane = document.getElementById(trackLaneId);
    const container = lane.closest('.parallel-tracks-container');
    const allLanes = container.querySelectorAll('.track-lane');

    if (lane.classList.contains('focused')) {
        allLanes.forEach(l => {
            l.classList.remove('focused', 'dimmed');
            l.querySelector('.track-focus-toggle').textContent = 'Focus on Lane';
        });
        return;
    }

    allLanes.forEach(l => {
        if (l.id === trackLaneId) {
            l.classList.add('focused');
            l.classList.remove('dimmed');
            l.querySelector('.track-focus-toggle').textContent = 'Unfocus Lane';
        } else {
            l.classList.add('dimmed');
            l.classList.remove('focused');
            l.querySelector('.track-focus-toggle').textContent = 'Focus on Lane';
        }
    });
};

// Recalculate progress bars and evaluate dependency lock states
window.recalculateAllProgress = function() {
    if (!window.roadmapConfig) return;
    
    const config = window.roadmapConfig;
    const lockKey = config.themeKey + '-locks-enabled';
    const locksEnabled = localStorage.getItem(lockKey) !== 'false';
    
    const isStageComplete = (stageId) => {
        const stageEl = document.getElementById(`stage-${stageId}`);
        if (!stageEl) return false;
        
        // If it's a parallel group node
        if (config.groupNumToSubIds[stageId]) {
            return config.groupNumToSubIds[stageId].every(subId => isStageComplete(subId));
        }
        
        const cbList = stageEl.querySelectorAll('.task-list input[type="checkbox"]');
        return cbList.length > 0 && Array.from(cbList).every(cb => cb.checked);
    };

    // Calculate individual stages progress percentage
    config.stages.forEach(stageId => {
        const stageEl = document.getElementById(`stage-${stageId}`);
        if (!stageEl) return;
        
        const cbList = stageEl.querySelectorAll('.task-list input[type="checkbox"]');
        const checkedCount = Array.from(cbList).filter(cb => cb.checked).length;
        const percent = cbList.length > 0 ? Math.round((checkedCount / cbList.length) * 100) : 0;
        
        const progBadge = document.getElementById(`progress-stage-${stageId}`);
        if (progBadge) {
            progBadge.textContent = `${percent}% Done`;
        }
    });

    // Calculate overall roadmap progress
    const allCheckboxes = document.querySelectorAll('.task-list input[type="checkbox"]');
    const checkedAll = Array.from(allCheckboxes).filter(cb => cb.checked).length;
    const overallPercent = allCheckboxes.length > 0 ? Math.round((checkedAll / allCheckboxes.length) * 100) : 0;
    
    const overallFill = document.getElementById('overall-progress-bar');
    const overallText = document.getElementById('overall-progress-text');
    if (overallFill) overallFill.style.width = `${overallPercent}%`;
    if (overallText) overallText.textContent = `${overallPercent}%`;

    // Apply locked states to stages dynamically
    config.stages.forEach(stageId => {
        const stageEl = document.getElementById(`stage-${stageId}`);
        if (!stageEl) return;
        
        const isUnlocked = config.checkPrerequisites(stageId, isStageComplete);
        const mapNode = document.getElementById(`map-node-${stageId}`);
        
        if (locksEnabled && !isUnlocked) {
            stageEl.classList.add('locked');
            if (mapNode) mapNode.classList.add('locked');
        } else {
            stageEl.classList.remove('locked');
            if (mapNode) {
                mapNode.classList.remove('locked');
                if (isStageComplete(stageId)) {
                    mapNode.classList.add('completed');
                    mapNode.classList.remove('active');
                } else {
                    mapNode.classList.add('active');
                    mapNode.classList.remove('completed');
                }
            }
        }
    });

    // Apply locked states to parallel groups
    Object.keys(config.groupNumToSubIds).forEach(gNum => {
        const groupWrapper = document.getElementById(`stage-${gNum}`);
        if (!groupWrapper) return;
        
        const subs = config.groupNumToSubIds[gNum];
        const allSubsLocked = subs.every(subId => document.getElementById(`stage-${subId}`).classList.contains('locked'));
        
        if (allSubsLocked && locksEnabled) {
            groupWrapper.classList.add('locked');
        } else {
            groupWrapper.classList.remove('locked');
        }
    });

    // Update connecting lines SVG representation
    window.updateEdgeVis();
};

// Update connecting lines in SVG
window.updateEdgeVis = function() {
    if (!window.roadmapConfig) return;
    
    const config = window.roadmapConfig;
    const isNodeComplete = (id) => {
        const nodeEl = document.getElementById(`stage-${id}`);
        if (!nodeEl) return false;
        
        // If it's a parallel group node
        if (config.groupNumToSubIds[id]) {
            return config.groupNumToSubIds[id].every(subId => isNodeComplete(subId));
        }
        
        const cbList = nodeEl.querySelectorAll('.task-list input[type="checkbox"]');
        return cbList.length > 0 && Array.from(cbList).every(cb => cb.checked);
    };

    const isNodeUnlocked = (id) => {
        const nodeEl = document.getElementById(`stage-${id}`);
        return nodeEl && !nodeEl.classList.contains('locked');
    };

    config.edges.forEach(edge => {
        const el = document.getElementById(edge.id);
        if (el) {
            el.classList.remove('active', 'completed');
            if (isNodeComplete(edge.parent)) {
                el.classList.add('completed');
                el.setAttribute('marker-end', 'url(#arrow-completed)');
            } else if (isNodeUnlocked(edge.child)) {
                el.classList.add('active');
                el.setAttribute('marker-end', 'url(#arrow-active)');
            } else {
                el.setAttribute('marker-end', 'url(#arrow)');
            }
        }
    });
};

// Initialize app on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Portal Page Initialization
    if (!window.roadmapConfig) {
        const savedTheme = localStorage.getItem(THEME_PORTAL_KEY) || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        window.updateThemeToggleButton(savedTheme);
        return;
    }
    
    // Roadmap Page Initialization
    const config = window.roadmapConfig;
    const savedTheme = localStorage.getItem(config.themeKey) || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    window.updateThemeToggleButton(savedTheme);
    
    // Setup Lock Toggle labels initial state
    const lockKey = config.themeKey + '-locks-enabled';
    const locksEnabled = localStorage.getItem(lockKey) !== 'false';
    const lockBtnLabel = document.getElementById('lock-toggle-label');
    const lockBtnIcon = document.getElementById('lock-toggle-icon');
    if (lockBtnLabel) lockBtnLabel.textContent = locksEnabled ? 'Locks Enabled' : 'Locks Disabled';
    if (lockBtnIcon) lockBtnIcon.textContent = locksEnabled ? '🔒' : '🔓';

    // Restore checkbox states from localStorage & update progress indicators
    config.stages.forEach(stageId => {
        const stageEl = document.getElementById(`stage-${stageId}`);
        if (!stageEl) return;
        
        const checkboxes = stageEl.querySelectorAll('.task-list input[type="checkbox"]');
        checkboxes.forEach(cb => {
            const savedVal = localStorage.getItem(cb.id);
            if (savedVal === 'true') {
                cb.checked = true;
            }
        });
    });

    // Update progress on each card
    const allCardHeaders = document.querySelectorAll('.topic-card');
    allCardHeaders.forEach(card => {
        window.updateCardProgress(card.id);
    });

    // Scroll Top Button Handler
    window.addEventListener('scroll', () => {
        const btn = document.getElementById('btn-scroll-top');
        if (btn) {
            if (window.scrollY > 300) {
                btn.classList.add('visible');
            } else {
                btn.classList.remove('visible');
            }
        }
    });

    // Perform initial progress calculation & locks enforcement
    window.recalculateAllProgress();
});
