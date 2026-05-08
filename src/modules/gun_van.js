const seed_random_number_generator = require('../util/rng.js');
const misc = require('../util/misc.js');
const tunables = require('../util/tunables.js');
const zones = require('../data/zones.json');
const path = require('path');

const DISABLED_LOCATION = 4;

// Get today's Gun Van location index
function get_gun_van_location() {
    let rng = new seed_random_number_generator(misc.get_seed_value());
    let locationIndex = rng.get_random_int_ranged(0n, (30n - 1n));

    while (locationIndex === DISABLED_LOCATION) {
        locationIndex = rng.get_random_int_ranged(0n, (30n - 1n));
    }

    return Number(locationIndex);
}

// Create full Gun Van data object
function get_gun_van_data() {
    const locationIndex = get_gun_van_location();
    const locationName = zones.gun_van[locationIndex];

    let message = `📍 Location: **#${locationIndex + 1}, ${locationName}**\n\n`;

    // ── Weapons ──────────────────────────────────────────────
    const weapons = [];
    for (let i = 0; i <= 9; i++) {
        const weapon_name = tunables.get_tunable('XM22_GUN_VAN_SLOT_WEAPON_TYPE_' + i);
        const discount    = tunables.get_tunable('XM22_GUN_VAN_SLOT_WEAPON_DISCOUNT_' + i);

        // Only include slots that have a valid weapon AND a real discount value
        if (
            weapon_name &&
            weapon_name !== 'invalid' &&
            discount !== 'invalid' &&
            discount !== undefined
        ) {
            const discountPct = Math.round(Number(discount) * 100);
            if (discountPct > 0) {
                weapons.push(`- ${weapon_name} — **${discountPct}% off**`);
            } else {
                weapons.push(`- ${weapon_name}`);
            }
        }
    }

    if (weapons.length > 0) {
        message += `🔫 **Weapons:**\n${weapons.join('\n')}\n\n`;
    } else {
        message += `🔫 **Weapons:** *(none this week)*\n\n`;
    }

    // ── Throwables ───────────────────────────────────────────
    const throwables = [];
    for (let i = 0; i <= 2; i++) {
        const throwable_name = tunables.get_tunable('XM22_GUN_VAN_SLOT_THROWABLE_TYPE_' + i);
        const discount       = tunables.get_tunable('XM22_GUN_VAN_SLOT_THROWABLE_DISCOUNT_' + i);

        if (
            throwable_name &&
            throwable_name !== 'invalid' &&
            discount !== 'invalid' &&
            discount !== undefined
        ) {
            const discountPct = Math.round(Number(discount) * 100);
            if (discountPct > 0) {
                throwables.push(`- ${throwable_name} — **${discountPct}% off**`);
            } else {
                throwables.push(`- ${throwable_name}`);
            }
        }
    }

    if (throwables.length > 0) {
        message += `💣 **Throwables:**\n${throwables.join('\n')}`;
    } else {
        message += `💣 **Throwables:** *(none this week)*`;
    }

    // Image path based on location number — e.g. assets/gunvan/5.png
    const imagePath = path.join(__dirname, `../assets/gunvan/${locationIndex + 1}.png`);

    return {
        locationIndex,
        locationName,
        message,
        imagePath
    };
}

module.exports = {
    get_gun_van_data
};
