export function createObjectPool(factory, initialSize = 20) {
    const pool = [];
    for (let i = 0; i < initialSize; i++) pool.push(factory());
    return {
        get() {
            return pool.length > 0 ? pool.pop() : factory();
        },
        release(item) {
            pool.push(item);
        }
    };
}