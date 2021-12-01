"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.extendBorsh = exports.decodeBattle = exports.decodeMetadata = exports.BATTLE_SCHEMA = exports.GAME_METADATA_SCHEMA = exports.UpdateStatsArgs = exports.UpdateArgs = exports.SubmitActionArgs = exports.ChooseTeamMemberArgs = exports.JoinBattleArgs = exports.CreateBattleArgs = exports.EnterBattleArgs = exports.CreateGameMetadataArgs = exports.Player = exports.Move = exports.Stats = void 0;
var borsh_1 = require("borsh");
var bs58_1 = __importDefault(require("bs58"));
var web3_js_1 = require("@solana/web3.js");
var borsh_2 = require("@project-serum/borsh");
var buffer_layout_1 = require("buffer-layout");
// Converts number into a 64-bit binary using its IEEE764 Representation, little endian
function convertFloat32ToBinary(num) {
    var c = new Uint8Array(new Float32Array([num]).buffer, 0, 4);
    return c;
}
// Converts number into a 64-bit binary using its IEEE764 Representation, little endian
function convertBinaryToFloat32(num) {
    var c = Float32Array.from(num)[0];
    return c;
}
var Stats = /** @class */ (function () {
    function Stats(args) {
        this.health = args.health;
        this.attack = args.attack;
        this.defense = args.defense;
        this.speed = args.speed;
        this.agility = args.agility;
        this.rage_points = args.rage_points;
    }
    return Stats;
}());
exports.Stats = Stats;
var Move = /** @class */ (function () {
    function Move(args) {
        this.move_name = args.move_name;
        this.stats_modifier = new Stats(args.stats_modifier);
        this.move_speed = args.move_speed;
        this.status_effect = args.status_effect;
        this.status_effect_chance = args.status_effect_chance;
    }
    return Move;
}());
exports.Move = Move;
var Player = /** @class */ (function () {
    function Player(args) {
        this.wallet = args.wallet;
        this.team_member0 = args.team_member0;
        this.team_member1 = args.team_member1;
        this.team_member2 = args.team_member2;
        this.current_move = args.current_move;
        this.active_team_member = args.active_team_member;
    }
    return Player;
}());
exports.Player = Player;
var CreateGameMetadataArgs = /** @class */ (function () {
    function CreateGameMetadataArgs(args) {
        this.instruction = 0;
        this.experience = args.experience;
        this.level = args.level;
        this.baseStats = args.baseStats;
        this.levelStats = args.levelStats;
        this.currStats = args.currStats;
        this.status_effect = args.status_effect;
        this.moves = __spreadArray([], args.moves, true);
    }
    return CreateGameMetadataArgs;
}());
exports.CreateGameMetadataArgs = CreateGameMetadataArgs;
var EnterBattleArgs = /** @class */ (function () {
    function EnterBattleArgs(args) {
        this.instruction = 4;
        this.battle_authority = args.battle_authority;
    }
    return EnterBattleArgs;
}());
exports.EnterBattleArgs = EnterBattleArgs;
var CreateBattleArgs = /** @class */ (function () {
    function CreateBattleArgs(args) {
        this.instruction = 0;
        this.date = args.date;
    }
    return CreateBattleArgs;
}());
exports.CreateBattleArgs = CreateBattleArgs;
var JoinBattleArgs = /** @class */ (function () {
    function JoinBattleArgs(args) {
        this.instruction = 1;
    }
    return JoinBattleArgs;
}());
exports.JoinBattleArgs = JoinBattleArgs;
var ChooseTeamMemberArgs = /** @class */ (function () {
    function ChooseTeamMemberArgs(args) {
        this.instruction = 2;
        this.index = args.index;
    }
    return ChooseTeamMemberArgs;
}());
exports.ChooseTeamMemberArgs = ChooseTeamMemberArgs;
var SubmitActionArgs = /** @class */ (function () {
    function SubmitActionArgs(args) {
        this.instruction = 3;
        this.move = args.move;
    }
    return SubmitActionArgs;
}());
exports.SubmitActionArgs = SubmitActionArgs;
var UpdateArgs = /** @class */ (function () {
    function UpdateArgs(args) {
        this.instruction = 4;
    }
    return UpdateArgs;
}());
exports.UpdateArgs = UpdateArgs;
var UpdateStatsArgs = /** @class */ (function () {
    function UpdateStatsArgs(args) {
        this.instruction = 3;
        this.stats = args.stats;
    }
    return UpdateStatsArgs;
}());
exports.UpdateStatsArgs = UpdateStatsArgs;
exports.GAME_METADATA_SCHEMA = new Map([
    [
        CreateGameMetadataArgs,
        {
            kind: 'struct',
            fields: [
                ['instruction', 'u8'],
                ['experience', 'u32'],
                ['level', 'u16'],
                ['baseStats', Stats],
                ['levelStats', Stats],
                ['currStats', Stats],
                ['status_effect', 'u8'],
                ['moves', [Move]],
            ]
        },
    ],
    [
        UpdateStatsArgs,
        {
            kind: 'struct',
            fields: [
                ['instruction', 'u8'],
                ['stats', Stats],
            ]
        },
    ],
    [
        EnterBattleArgs,
        {
            kind: 'struct',
            fields: [
                ['instruction', 'u8'],
                ['battle_authority', 'pubkeyAsString']
            ]
        },
    ],
    [
        Stats,
        {
            kind: 'struct',
            fields: [
                ['health', 'Float32'],
                ['attack', 'Float32'],
                ['defense', 'Float32'],
                ['speed', 'Float32'],
                ['agility', 'Float32'],
                ['rage_points', 'Float32']
            ]
        },
    ],
    [
        Move,
        {
            kind: 'struct',
            fields: [
                ['move_name', 'string'],
                ['stats_modifier', Stats],
                ['move_speed', 'Float32'],
                ['status_effect', 'u8'],
                ['status_effect_chance', 'u8'],
            ]
        },
    ],
]);
exports.BATTLE_SCHEMA = new Map([
    [
        CreateBattleArgs,
        {
            kind: 'struct',
            fields: [
                ['instruction', 'u8'],
                ['date', 'string'],
            ]
        },
    ],
    [
        JoinBattleArgs,
        {
            kind: 'struct',
            fields: [
                ['instruction', 'u8'],
            ]
        },
    ],
    [
        ChooseTeamMemberArgs,
        {
            kind: 'struct',
            fields: [
                ['instruction', 'u8'],
                ['index', 'u8'],
            ]
        },
    ],
    [
        SubmitActionArgs,
        {
            kind: 'struct',
            fields: [
                ['instruction', 'u8'],
                ['move', Move],
            ]
        }
    ],
    [
        UpdateArgs,
        {
            kind: 'struct',
            fields: [
                ['instruction', 'u8'],
            ]
        }
    ],
    [
        Stats,
        {
            kind: 'struct',
            fields: [
                ['health', 'Float32'],
                ['attack', 'Float32'],
                ['defense', 'Float32'],
                ['speed', 'Float32'],
                ['agility', 'Float32'],
                ['rage_points', 'Float32']
            ]
        },
    ],
    [
        Move,
        {
            kind: 'struct',
            fields: [
                ['move_name', 'string'],
                ['stats_modifier', Stats],
                ['move_speed', 'Float32'],
                ['status_effect', 'u8'],
                ['status_effect_chance', 'u8'],
            ]
        },
    ],
]);
var STATS_LAYOUT = (0, borsh_2.struct)([
    (0, buffer_layout_1.f32)('health'),
    (0, buffer_layout_1.f32)('attack'),
    (0, buffer_layout_1.f32)('defense'),
    (0, buffer_layout_1.f32)('speed'),
    (0, buffer_layout_1.f32)('agility'),
    (0, buffer_layout_1.f32)('rage_points'),
]);
var MOVE_LAYOUT = (0, borsh_2.struct)([
    (0, borsh_2.str)('move_name'),
    STATS_LAYOUT.replicate('stats_modifier'),
    (0, buffer_layout_1.f32)('move_speed'),
    (0, borsh_2.u8)('status_effect'),
    (0, borsh_2.u8)('status_effect_chance'),
]);
var PLAYER_LAYOUT = (0, borsh_2.struct)([
    (0, borsh_2.publicKey)('wallet'),
    (0, borsh_2.publicKey)('team_member0'),
    (0, borsh_2.publicKey)('team_member1'),
    (0, borsh_2.publicKey)('team_member2'),
    MOVE_LAYOUT.replicate('current_move'),
    (0, borsh_2.u8)('active_team_member'),
]);
var METADATA_LAYOUT = (0, borsh_2.struct)([
    (0, buffer_layout_1.u32)('schemaVersion'),
    (0, borsh_2.publicKey)('updateAuthority'),
    (0, borsh_2.publicKey)('playerAuthority'),
    (0, borsh_2.publicKey)('battleAuthority'),
    (0, buffer_layout_1.u32)('experience'),
    (0, buffer_layout_1.u16)('level'),
    STATS_LAYOUT.replicate('baseStats'),
    STATS_LAYOUT.replicate('levelStats'),
    STATS_LAYOUT.replicate('currStats'),
    (0, borsh_2.u8)('status_effect'),
    (0, borsh_2.vec)(MOVE_LAYOUT.replicate('moves'), 'moves'),
    (0, borsh_2.array)((0, borsh_2.u8)(), 128, 'padding'),
]);
var BATTLE_LAYOUT = (0, borsh_2.struct)([
    (0, buffer_layout_1.u32)('schemaVersion'),
    (0, borsh_2.str)('date'),
    (0, borsh_2.publicKey)('updateAuthority'),
    PLAYER_LAYOUT.replicate("player_1"),
    PLAYER_LAYOUT.replicate("player_2"),
    (0, borsh_2.u8)("status"),
    (0, borsh_2.u8)('roundNumber'),
    (0, borsh_2.array)((0, borsh_2.u8)(), 128, 'padding'),
]);
// eslint-disable-next-line no-control-regex
var METADATA_REPLACE = new RegExp('\u0000', 'g');
function decodeMetadata(buffer) {
    var metadata = METADATA_LAYOUT.decode(buffer);
    metadata.updateAuthority = metadata.updateAuthority.toString();
    metadata.playerAuthority = metadata.playerAuthority.toString();
    metadata.battleAuthority = metadata.battleAuthority.toString();
    for (var i = 0; i < metadata.moves.length; i++) {
        metadata.moves[i].move_name = metadata.moves[i].move_name.replace(METADATA_REPLACE, '');
    }
    metadata.padding = [];
    return metadata;
}
exports.decodeMetadata = decodeMetadata;
;
// eslint-disable-next-line no-control-regex
var BATTLE_REPLACE = new RegExp('\u0000', 'g');
function decodeBattle(buffer) {
    var battle = BATTLE_LAYOUT.decode(buffer);
    battle.date = battle.date.replace(BATTLE_REPLACE, '');
    // battle.updateAuthority = battle.updateAuthority;
    // battle.player1.wallet = battle.player1.wallet;
    // battle.player1.teamMember0 = battle.player1.teamMember0;
    // battle.player1.teamMember1 = battle.player1.teamMember1;
    // battle.player1.teamMember2 = battle.player1.teamMember2;
    // battle.player2.wallet = battle.player2.wallet;
    // battle.player2.teamMember0 = battle.player2.teamMember0;
    // battle.player2.teamMember1 = battle.player2.teamMember1;
    // battle.player2.teamMember2 = battle.player2.teamMember2;
    battle.date = battle.date.replace(BATTLE_REPLACE, '');
    battle.player_1.current_move.move_name = battle.player_1.current_move.move_name.replace(BATTLE_REPLACE, '');
    battle.player_2.current_move.move_name = battle.player_2.current_move.move_name.replace(BATTLE_REPLACE, '');
    return battle;
}
exports.decodeBattle = decodeBattle;
;
var extendBorsh = function () {
    borsh_1.BinaryReader.prototype.readPubkey = function () {
        var reader = this;
        var array = reader.readFixedArray(32);
        return new web3_js_1.PublicKey(array);
    };
    borsh_1.BinaryWriter.prototype.writePubkey = function (value) {
        var writer = this;
        writer.writeFixedArray(value.toBuffer());
    };
    borsh_1.BinaryReader.prototype.readPubkeyAsString = function () {
        var reader = this;
        var array = reader.readFixedArray(32);
        return bs58_1["default"].encode(array);
    };
    borsh_1.BinaryWriter.prototype.writePubkeyAsString = function (value) {
        var writer = this;
        writer.writeFixedArray(bs58_1["default"].decode(value));
    };
    borsh_1.BinaryReader.prototype.readFloat32 = function () {
        var reader = this;
        var array = reader.readFixedArray(4);
        return convertBinaryToFloat32(array);
    };
    borsh_1.BinaryWriter.prototype.writeFloat32 = function (value) {
        var writer = this;
        writer.writeFixedArray(convertFloat32ToBinary(value));
    };
};
exports.extendBorsh = extendBorsh;
(0, exports.extendBorsh)();
