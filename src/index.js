async function cache_store(key, value) {}
async function cache_retrive(key) {}
async function slow_function(input) {}

//This function allows the inject cache dependency for better testing.
function cached_function(cache_store, cache_retrive, callback) {
    async function callback_and_cache(input) {
        const result = await callback(input);

        cache_store(input, result);

        return result;
    }

    async function cache_retrieve_wrap(input) {
        const result = await cache_retrive(input);
        
        if (result === undefined)
            throw Error(`undefined value return from cache for key: ${input}`);
        
        return result;
    }

    return (input) => {
        return Promise.any([callback_and_cache(input), cache_retrieve_wrap(input)])
    }
}

function memoize(slow_function) {
    const fast_function = cached_function(
        cache_store, cache_retrive, slow_function)

    return fast_function;
}

module.exports = {
    memoize,
    cached_function
}