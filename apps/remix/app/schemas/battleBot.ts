import { z } from "zod";

// Constants for validation
const MIN_NAME_LENGTH = 3;
const MAX_NAME_LENGTH = 50;
const MIN_PROMPT_LENGTH = 10;
const MAX_PROMPT_LENGTH = 500;
const MIN_STAT_VALUE = 2;
const MAX_STAT_VALUE = 4;

// Attributes schema
export const BattleBotAttributesSchema = z.object({
  attack: z
    .number()
    .min(MIN_STAT_VALUE, `Attack must be at least ${MIN_STAT_VALUE}`)
    .max(MAX_STAT_VALUE, `Attack cannot exceed ${MAX_STAT_VALUE}`),
  defense: z
    .number()
    .min(MIN_STAT_VALUE, `Defense must be at least ${MIN_STAT_VALUE}`)
    .max(MAX_STAT_VALUE, `Defense cannot exceed ${MAX_STAT_VALUE}`),
  speed: z
    .number()
    .min(MIN_STAT_VALUE, `Speed must be at least ${MIN_STAT_VALUE}`)
    .max(MAX_STAT_VALUE, `Speed cannot exceed ${MAX_STAT_VALUE}`),
  mainWeapon: z.number().int().min(1, "Must select a weapon"),
});

// Main BattleBot metadata schema
export const BattleBotMetadataSchema = z.object({
  version: z.literal(1),
  name: z
    .string()
    .min(MIN_NAME_LENGTH, `Name must be at least ${MIN_NAME_LENGTH} characters`)
    .max(MAX_NAME_LENGTH, `Name cannot exceed ${MAX_NAME_LENGTH} characters`)
    .regex(
      /^[a-zA-Z0-9\s\-_]+$/,
      "Name can only contain letters, numbers, spaces, hyphens, and underscores"
    ),
  battlePrompt: z
    .string()
    .min(
      MIN_PROMPT_LENGTH,
      `Battle prompt must be at least ${MIN_PROMPT_LENGTH} characters`
    )
    .max(
      MAX_PROMPT_LENGTH,
      `Battle prompt cannot exceed ${MAX_PROMPT_LENGTH} characters`
    ),
  image: z
    .string()
    .url("Must be a valid URL")
    .startsWith("ipfs://", "Image must be stored on IPFS"),
  attributes: BattleBotAttributesSchema,
});

// Type inference
export type BattleBotMetadataSchemaType = z.infer<
  typeof BattleBotMetadataSchema
>;

// Form schema (without IPFS image, used for the creation form)
export const BattleBotFormSchema = BattleBotMetadataSchema.omit({
  version: true,
  image: true,
});

export type BattleBotFormSchemaType = z.infer<typeof BattleBotFormSchema>;
