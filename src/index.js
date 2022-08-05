async function cache_store(key, value) {}
async function cache_retrive(key) {}
async function slow_function(input) {}

//This function allows the depency injection from the cache.
function cached_function(cache_store, cache_retrive, callback) {
    return (input) => {
        return new Promise(resolve => {

            cache_retrive(input)
                .then(value => {
                    if (value !== undefined) {
                        resolve(value);
                    }
                });

            callback(input)
                .then(value => {
                    cache_store(input, value);
                    resolve(value)
                });
        });
    }
}

function memoize(slow_function) {
    return cached_function(cache_store, cache_retrive, slow_function);
}

module.exports = {
    memoize,
    cached_function
}