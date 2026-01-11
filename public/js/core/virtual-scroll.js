// LVS Returns - Virtual Scrolling for Large Lists
// ============================================

class VirtualScroll {
  constructor(container, items, options = {}) {
    this.container = container;
    this.items = items;
    this.options = {
      itemHeight: options.itemHeight || 50,
      buffer: options.buffer || 5,
      renderItem: options.renderItem || this.defaultRenderItem,
      ...options
    };
    
    this.visibleCount = 0;
    this.scrollTop = 0;
    this.startIndex = 0;
    this.endIndex = 0;
    
    this.init();
  }

  init() {
    // Container-Styling
    this.container.style.position = 'relative';
    this.container.style.overflow = 'auto';
    this.container.style.height = this.options.height || '100%';
    
    // Spacer-Elemente
    this.spacerTop = document.createElement('div');
    this.spacerTop.className = 'virtual-scroll-spacer-top';
    this.spacerTop.style.height = '0px';
    
    this.spacerBottom = document.createElement('div');
    this.spacerBottom.className = 'virtual-scroll-spacer-bottom';
    this.spacerBottom.style.height = '0px';
    
    // Content-Container
    this.contentContainer = document.createElement('div');
    this.contentContainer.className = 'virtual-scroll-content';
    
    this.container.appendChild(this.spacerTop);
    this.container.appendChild(this.contentContainer);
    this.container.appendChild(this.spacerBottom);
    
    // Scroll-Listener
    this.container.addEventListener('scroll', () => this.handleScroll());
    
    // Initial Render
    this.updateVisibleCount();
    this.render();
  }

  updateVisibleCount() {
    const containerHeight = this.container.clientHeight;
    this.visibleCount = Math.ceil(containerHeight / this.options.itemHeight) + this.options.buffer * 2;
  }

  handleScroll() {
    this.scrollTop = this.container.scrollTop;
    this.calculateIndices();
    this.render();
  }

  calculateIndices() {
    this.startIndex = Math.max(0, Math.floor(this.scrollTop / this.options.itemHeight) - this.options.buffer);
    this.endIndex = Math.min(
      this.items.length,
      this.startIndex + this.visibleCount
    );
  }

  render() {
    // Spacer oben
    const spacerTopHeight = this.startIndex * this.options.itemHeight;
    this.spacerTop.style.height = `${spacerTopHeight}px`;
    
    // Sichtbare Items
    const visibleItems = this.items.slice(this.startIndex, this.endIndex);
    this.contentContainer.innerHTML = visibleItems.map((item, index) => {
      const actualIndex = this.startIndex + index;
      return this.options.renderItem(item, actualIndex);
    }).join('');
    
    // Spacer unten
    const spacerBottomHeight = (this.items.length - this.endIndex) * this.options.itemHeight;
    this.spacerBottom.style.height = `${spacerBottomHeight}px`;
  }

  defaultRenderItem(item, index) {
    return `<div class="virtual-scroll-item" data-index="${index}">${item}</div>`;
  }

  updateItems(newItems) {
    this.items = newItems;
    this.render();
  }

  scrollToIndex(index) {
    const scrollTop = index * this.options.itemHeight;
    this.container.scrollTop = scrollTop;
    this.handleScroll();
  }

  getVisibleItems() {
    return this.items.slice(this.startIndex, this.endIndex);
  }

  destroy() {
    this.container.removeEventListener('scroll', this.handleScroll);
    this.container.innerHTML = '';
  }
}

// Globale Funktion
window.createVirtualScroll = (container, items, options) => {
  return new VirtualScroll(container, items, options);
};

console.log('✅ Virtual Scroll initialisiert');
