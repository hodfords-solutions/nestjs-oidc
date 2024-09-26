import Redis from 'ioredis';
import isEmpty from 'lodash.isempty';

const grantable = new Set([
    'AccessToken',
    'AuthorizationCode',
    'RefreshToken',
    'DeviceCode',
    'BackchannelAuthenticationRequest'
]);

const consumable = new Set(['AuthorizationCode', 'RefreshToken', 'DeviceCode', 'BackchannelAuthenticationRequest']);

function grantKeyFor(id: string) {
    return `grant:${id}`;
}

function userCodeKeyFor(userCode: string) {
    return `userCode:${userCode}`;
}

function uidKeyFor(uid: string) {
    return `uid:${uid}`;
}

export class RedisAdapter {
    private client: Redis;

    constructor(
        private name: string,
        redisHost: string = 'localhost:6379'
    ) {
        this.client = new Redis(redisHost, { keyPrefix: `oidc:${name}:` });
    }

    async upsert(id: any, payload: any, expiresIn: any) {
        const key = this.key(id);
        const store = consumable.has(this.name) ? { payload: JSON.stringify(payload) } : JSON.stringify(payload);

        const multi = this.client.multi();
        multi[consumable.has(this.name) ? 'hmset' : 'set'](key, store as any);

        if (expiresIn) {
            multi.expire(key, expiresIn);
        }

        if (grantable.has(this.name) && payload.grantId) {
            const grantKey = grantKeyFor(payload.grantId);
            multi.rpush(grantKey, key);
            // if you're seeing grant key lists growing out of acceptable proportions consider using LTRIM
            // here to trim the list to an appropriate length
            const ttl = await this.client.ttl(grantKey);
            if (expiresIn > ttl) {
                multi.expire(grantKey, expiresIn);
            }
        }

        if (payload.userCode) {
            const userCodeKey = userCodeKeyFor(payload.userCode);
            multi.set(userCodeKey, id);
            multi.expire(userCodeKey, expiresIn);
        }

        if (payload.uid) {
            const uidKey = uidKeyFor(payload.uid);
            multi.set(uidKey, id);
            multi.expire(uidKey, expiresIn);
        }

        await multi.exec();
    }

    async find(id: string) {
        const data = consumable.has(this.name)
            ? await this.client.hgetall(this.key(id))
            : await this.client.get(this.key(id));

        if (isEmpty(data)) {
            return undefined;
        }

        if (typeof data === 'string') {
            return JSON.parse(data);
        }
        const { payload, ...rest } = data;
        return {
            ...rest,
            ...JSON.parse(payload)
        };
    }

    async findByUid(uid: string) {
        const id = await this.client.get(uidKeyFor(uid));
        return this.find(id);
    }

    async findByUserCode(userCode: string) {
        const id = await this.client.get(userCodeKeyFor(userCode));
        return this.find(id);
    }

    async destroy(id: string) {
        const key = this.key(id);
        await this.client.del(key);
    }

    async revokeByGrantId(grantId: string) {
        const multi = this.client.multi();
        const tokens = await this.client.lrange(grantKeyFor(grantId), 0, -1);
        tokens.forEach((token) => multi.del(token));
        multi.del(grantKeyFor(grantId));
        await multi.exec();
    }

    async consume(id: string) {
        await this.client.hset(this.key(id), 'consumed', Math.floor(Date.now() / 1000));
    }

    key(id: string) {
        return `${this.name}:${id}`;
    }
}
