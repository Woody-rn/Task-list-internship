class TaskManager {
    constructor() {
        this.tasks = [];
        this.filteredTasks = [];
        this.apiBaseUrl = '/api/tasks';

        this.initializeElements();
        this.bindEvents();
        this.loadTasks();
    }

    initializeElements() {
        this.elements = {
            tasksContainer: document.getElementById('tasksContainer'),
            loadingIndicator: document.getElementById('loadingIndicator'),
            errorMessage: document.getElementById('errorMessage'),
            searchInput: document.getElementById('searchInput'),
            refreshBtn: document.getElementById('refreshBtn'),
            expandAllBtn: document.getElementById('expandAll'),
            collapseAllBtn: document.getElementById('collapseAll'),
            tasksCount: document.getElementById('tasksCount'),
            footerCount: document.getElementById('footerCount'),
            statsContent: document.getElementById('statsContent'),
            modal: document.getElementById('taskModal'),
            modalClose: document.querySelector('.modal-close'),
            modalTitle: document.getElementById('modalTitle'),
            modalContent: document.getElementById('modalContent'),
            modalMeta: document.getElementById('modalMeta')
        };
    }

    bindEvents() {
        this.elements.searchInput.addEventListener('input', () => this.filterTasks());
        this.elements.refreshBtn.addEventListener('click', () => this.loadTasks());
        this.elements.expandAllBtn.addEventListener('click', () => this.expandAllTasks());
        this.elements.collapseAllBtn.addEventListener('click', () => this.collapseAllTasks());
        this.elements.modalClose.addEventListener('click', () => this.closeModal());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });

        this.elements.modal.addEventListener('click', (e) => {
            if (e.target === this.elements.modal) this.closeModal();
        });
    }

    async loadTasks() {
        this.showLoading(true);
        this.elements.errorMessage.classList.add('hidden');

        try {
            const response = await fetch(this.apiBaseUrl);
            if (!response.ok) throw new Error('Ошибка загрузки');

            this.tasks = await response.json();
            this.updateStats();
            this.renderTasks();
            this.filterTasks();
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.showError();
        } finally {
            this.showLoading(false);
        }
    }

    renderTasks() {
        const container = this.elements.tasksContainer;
        container.innerHTML = '';

        this.filteredTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            container.appendChild(taskElement);
        });

        this.updateCounters();
    }

    createTaskElement(task) {
        const taskCard = document.createElement('div');
        taskCard.className = 'task-card';
        taskCard.dataset.id = task.id;

        const isImportant = task.title.toLowerCase().includes('important') ||
            task.title.toLowerCase().includes('важн');

        const icon = isImportant ? 'fa-star' : 'fa-file-alt';
        const importantClass = isImportant ? 'important' : '';

        taskCard.innerHTML = `
            <div class="task-header" data-task-id="${task.id}">
                <div class="task-title">
                    <i class="fas ${icon} task-icon ${importantClass}"></i>
                    <span>${this.escapeHtml(task.title)}</span>
                </div>
                <div class="task-meta">
                    <span class="task-date">
                        <i class="far fa-calendar"></i>
                        ${task.createdAt || 'Неизвестно'}
                    </span>
                    <span class="task-size">
                        <i class="fas fa-file-alt"></i>
                        ${Math.ceil((task.content?.length || 0) / 1024)} KB
                    </span>
                    <i class="fas fa-chevron-right expand-icon"></i>
                </div>
            </div>
            <div class="task-content">
                <pre>${this.escapeHtml(task.content || 'Нет содержимого')}</pre>
                <div class="task-actions">
                    <button class="btn btn-small view-full-btn" data-task-id="${task.id}">
                        <i class="fas fa-expand"></i> Полный вид
                    </button>
                    <button class="btn btn-small copy-btn" data-task-id="${task.id}">
                        <i class="far fa-copy"></i> Копировать
                    </button>
                </div>
            </div>
        `;

        // Bind events for this task
        const header = taskCard.querySelector('.task-header');
        const viewFullBtn = taskCard.querySelector('.view-full-btn');
        const copyBtn = taskCard.querySelector('.copy-btn');

        header.addEventListener('click', () => this.toggleTask(taskCard));
        viewFullBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openModal(task);
        });
        copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.copyToClipboard(task.content);
        });

        return taskCard;
    }

    toggleTask(taskCard) {
        taskCard.classList.toggle('expanded');
        const icon = taskCard.querySelector('.expand-icon');
        icon.classList.toggle('fa-chevron-right');
        icon.classList.toggle('fa-chevron-down');
    }

    expandAllTasks() {
        document.querySelectorAll('.task-card').forEach(card => {
            card.classList.add('expanded');
            const icon = card.querySelector('.expand-icon');
            icon.classList.remove('fa-chevron-right');
            icon.classList.add('fa-chevron-down');
        });
    }

    collapseAllTasks() {
        document.querySelectorAll('.task-card').forEach(card => {
            card.classList.remove('expanded');
            const icon = card.querySelector('.expand-icon');
            icon.classList.add('fa-chevron-right');
            icon.classList.remove('fa-chevron-down');
        });
    }

    filterTasks() {
        const searchTerm = this.elements.searchInput.value.toLowerCase();

        this.filteredTasks = this.tasks.filter(task => {
            const titleMatch = task.title?.toLowerCase().includes(searchTerm);
            const contentMatch = task.content?.toLowerCase().includes(searchTerm);
            return titleMatch || contentMatch;
        });

        this.renderTasks();
    }

    openModal(task) {
        this.elements.modalTitle.textContent = task.title;
        this.elements.modalContent.textContent = task.content;
        this.elements.modalMeta.textContent = `Файл: ${task.fileName} | Создано: ${task.createdAt}`;
        this.elements.modal.classList.add('active');

        // Add copy button to modal
        const copyBtn = document.createElement('button');
        copyBtn.className = 'btn btn-primary';
        copyBtn.innerHTML = '<i class="far fa-copy"></i> Копировать текст';
        copyBtn.onclick = () => this.copyToClipboard(task.content);

        const footer = this.elements.modal.querySelector('.modal-footer');
        footer.appendChild(copyBtn);
    }

    closeModal() {
        this.elements.modal.classList.remove('active');
        const footer = this.elements.modal.querySelector('.modal-footer');
        const copyBtn = footer.querySelector('button');
        if (copyBtn) copyBtn.remove();
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('Текст скопирован в буфер обмена!');
        } catch (err) {
            console.error('Ошибка копирования:', err);
        }
    }

    updateStats() {
        const stats = {
            total: this.tasks.length,
            totalSize: this.tasks.reduce((sum, task) =>
                sum + (task.content?.length || 0), 0),
            recent: this.tasks.filter(task =>
                task.createdAt?.includes('2024')).length
        };

        this.elements.statsContent.innerHTML = `
            <p>Всего задач: <strong>${stats.total}</strong></p>
            <p>Общий размер: <strong>${Math.ceil(stats.totalSize / 1024)} KB</strong></p>
            <p>Задач за 2024: <strong>${stats.recent}</strong></p>
        `;
    }

    updateCounters() {
        this.elements.tasksCount.textContent = this.filteredTasks.length;
        this.elements.footerCount.textContent = this.tasks.length;
    }

    showLoading(show) {
        this.elements.loadingIndicator.style.display = show ? 'flex' : 'none';
    }

    showError() {
        this.elements.errorMessage.classList.remove('hidden');
    }

    showNotification(message) {
        // Создаем временное уведомление
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1001;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);

        // Добавляем стили для анимации
        if (!document.getElementById('notificationStyles')) {
            const style = document.createElement('style');
            style.id = 'notificationStyles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const taskManager = new TaskManager();
    window.taskManager = taskManager; // Для доступа из консоли
});