const debug = require('debug')('online-new');

/**
 * Create a new `Online` instance.
 *
 * @param {RedisClient} client
 * @param {Object} options
 * @return {Online}
 * @api public
 */

module.exports = function (client, options) {
    return new Online(client, options);
};

class Online {
    /**
    * Initialize an `Online` tracker instance
    * with the given redis `client`.
    *
    * Options:
    *
    *  - `ttl` time-to-live in milliseconds [15 minutes]
    *
    * NOTE: `ttl` must not exceed 60 minutes.
    *
    * @param {RedisClient} client
    * @param {Object} options
    */
    constructor(client, options) {
        options = options || {};
        this.db = client;
        this.ttl = options.ttl || 900000;
        this.prefix = 'online';
    }

    /**
     * Clear all activity tracking.
     *
     * @param {Function} fn
     * @api public
     */

    async clear() {
        debug('clear');
        const keys = await this.db.keys(this.prefix + ':*');
        debug('clearing %j', keys);
        if (!keys.length) return null;
        await this.db.del(keys);
    };

    /**
     * Add `id` to the current minute set.
     *
     * @param {Number|String} id
     * @api public
     */

    async add(id) {
        const min = new Date().getMinutes();
        const key = this.prefix + ':' + min;
        const ttl = this.ttl / 1000;
        debug('add %s to %s', id, key);
        await this.db
            .multi()
            .sAdd(key, id)
            .expire(key, ttl)
            .exec();
    };

    /**
     * Get active user ids within the last `n` minutes.
     *
     * @param {Number} n
     * @api public
     */

    async last(n) {
        const min = new Date().getMinutes();
        const start = min - n;
        if (start < 0) start = 60 + start;
        debug('active %s..%s', start, min);
        const keys = this.#keyRange(start, min);
        return await this.db.sUnion(keys);
    };

    /**
     * Get online key range `from` .. `to`.
     *
     * @param {Number} from
     * @param {Number} to
     * @return {Array}
     * @api private
     */

    #keyRange(from, to) {
        const keys = [];
        do {
            keys.push(this.prefix + ':' + from);
        } while (from++ < to);
        return keys;
    };
}
