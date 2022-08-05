const { cached_function } = require('../src/index');

describe('memoize', () => { 
    function sleep(ms) {
        return new Promise(res => setTimeout(res, ms));
    }

    function addDelayToFn(callback, delay) {
        return async (input) => {
            await sleep(delay);
            const result = await callback(input);

            return result;
        };
    };

    function mockCache(retrieveDelay = 0) {
        const cache = {};

        async function cache_retrieve(key) {
            await sleep(retrieveDelay);
            return cache[key];
        }

        async function cache_store(key, value) {
            cache[key] = value;
        }

        return {cache_retrieve, cache_store}
    }

    function initMemoize(callback, {callbackDelay, cacheDelay} = {}) {
        const delayedCallback = addDelayToFn(callback, callbackDelay?? 3);
        const mockedCache     = mockCache(cacheDelay?? 0);

        return cached_function(
            mockedCache.cache_store,
            mockedCache.cache_retrieve,
            delayedCallback
        );
    }

    it('returns a function', () => {
        const callback = () => {};

        const memoizedCallback = initMemoize(callback);

        expect(memoizedCallback).toBeInstanceOf(Function);
    });

    describe('returned function', () => {
        it('returns the same value case 1', async () => {
            const expectedValueReturned = 5;
            const callback         = async () => expectedValueReturned;
            const memoizedCallback = initMemoize(callback);

            const returnedValue = await memoizedCallback();

            expect(returnedValue).toBe(expectedValueReturned);
        });

        it('returns the same value same value case 2', async () => {
            const expectedValueReturned = 'Valor esperado';
            const callback         = async () => expectedValueReturned;
            const memoizedCallback = initMemoize(callback);

            const returnedValue = await memoizedCallback();

            expect(returnedValue).toBe(expectedValueReturned);
        });
    });

    describe('cache returns', () => {
        it('catch and return the right value', async () => {
            const callback         = async (_) => Math.random();
            const memoizedCallback = initMemoize(callback, {callbackDelay: 10, cacheDelay: 0});
            const firstValue       = await memoizedCallback(1);

            const memoizedValue    = await memoizedCallback(1);

            expect(memoizedValue).toBe(firstValue)
        });
    });

    describe('when cache is been setted', () => {
        it('callback is allways called', async () => {
            const expectedCalls = 3;
            const callback      = jest.fn();
            const memoizedCallback = initMemoize(callback, {callbackDelay: 5, cacheDelay: 0});

            await Promise.all([memoizedCallback(1), memoizedCallback(1), memoizedCallback(1)]);
            await sleep(15);

            expect(callback).toHaveBeenCalledTimes(expectedCalls);
        });

        it('updates the cache allways', async () => {
            let incremental = 0;
            const callback  = async () => ++incremental;
            const memoizedCallback = initMemoize(callback, {callbackDelay: 5, cacheDelay: 2});
            const expectedReturnedValues = [1, 1, 2, 3];
            const retunedValues          = [];

            retunedValues.push(await memoizedCallback(1));
            await sleep(10);
            retunedValues.push(await memoizedCallback(1));  // Here the cache is refreshed after the cache has been retrieved
            await sleep(10);
            retunedValues.push(await memoizedCallback(1));
            await sleep(10);
            retunedValues.push(await memoizedCallback(1));

            expect(retunedValues).toEqual(expectedReturnedValues);
        });
    });

    describe('when the fastest function returns the value', () => {
        it('is returned by callback when it is faster than cache', async () => {
            let incremental = 0;
            const callback  = async () => ++incremental;
            const memoizedCallback = initMemoize(callback, {callbackDelay: 5, cacheDelay: 10});
            const expectedReturnedValues = [1, 2, 3, 4];
            const retunedValues          = [];

            retunedValues.push(await memoizedCallback(1));
            await sleep(10);
            retunedValues.push(await memoizedCallback(1));
            await sleep(10);
            retunedValues.push(await memoizedCallback(1));
            await sleep(10);
            retunedValues.push(await memoizedCallback(1));

            expect(retunedValues).toEqual(expectedReturnedValues);
        });
    });
});