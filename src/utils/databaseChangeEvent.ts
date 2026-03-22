// 数据库变动事件触发器
// 当其他页面有数据库操作时，调用此函数通知Header组件更新数据

export function triggerDatabaseChange() {
  // 触发自定义事件，Header组件会监听此事件并更新数据
  const event = new CustomEvent('databaseChange', {
    detail: {
      timestamp: Date.now(),
      source: 'database-operation'
    }
  });
  window.dispatchEvent(event);
}

// 数据库操作包装器，自动触发更新事件
export function withDatabaseUpdate<T extends (...args: any[]) => Promise<any>>(
  operation: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      const result = await operation(...args);
      // 操作成功后触发更新
      triggerDatabaseChange();
      return result;
    } catch (error) {
      console.error('数据库操作失败:', error);
      throw error;
    }
  }) as T;
}