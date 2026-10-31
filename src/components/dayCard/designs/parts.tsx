import { dayCardCopy } from '@/copy';
import { toRoman } from '@/lib/toRoman';
import { useTheme } from '@/theme';

import { Txt, type TxtProps } from '../../Txt';
import type { DayCardContent } from './types';

type Face = 'display' | 'body' | 'bodyMedium' | 'bodySemiBold';

export type CardTxtProps = Omit<TxtProps, 'variant' | 'color'> & {
  /** An exact colour from the card style. */
  ink: string;
  size: number;
  face?: Face;
  /** Letter spacing in px. */
  tracking?: number;
  /** Line height; defaults to 1.2 times the size. */
  leading?: number;
};

/**
 * Text on the card, set at an exact size. The card is a fixed picture, so it ignores the phone's
 * font scale (a shared card must look the same everywhere) but still uses the theme's families.
 */
export function CardTxt({
  ink,
  size,
  face = 'display',
  tracking = 0,
  leading,
  style,
  ...rest
}: CardTxtProps) {
  const theme = useTheme();
  return (
    <Txt
      maxFontSizeMultiplier={1}
      {...rest}
      style={[
        {
          fontFamily: theme.fonts[face],
          fontSize: size,
          lineHeight: leading ?? Math.round(size * 1.2),
          letterSpacing: tracking,
          color: ink,
        },
        style,
      ]}
    />
  );
}

/** The VINCO wordmark, in the card's accent. */
export function Wordmark({ ink, size = 15 }: { ink: string; size?: number }) {
  return (
    <CardTxt ink={ink} size={size} tracking={size / 3}>
      {dayCardCopy.wordmark}
    </CardTxt>
  );
}

/** "DAY XII OF LX", or "FREE TRAINING · DAY III". */
export function eyebrowFor({ dayNumber, lengthDays, isLudus }: DayCardContent): string {
  return isLudus
    ? dayCardCopy.ludusEyebrow(toRoman(dayNumber))
    : dayCardCopy.eyebrow(toRoman(dayNumber), toRoman(Math.max(1, lengthDays)));
}

/** "Campaign 12", or "12 days trained". */
export function campaignLineFor({ campaign, isLudus }: DayCardContent): string {
  return isLudus ? dayCardCopy.trained(campaign) : dayCardCopy.campaign(campaign);
}

/** Faded foreground for secondary marks. */
export const FADED = 0.7;
