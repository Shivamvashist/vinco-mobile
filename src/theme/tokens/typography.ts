import type { FontFamilies, TypeScale } from '../types';

/**
 * Builds the type scale for a theme's fonts. Sizes and line heights come from the UI prototype.
 * Display face (Marcellus in Vinco) is for big moments only; everything else uses the body face.
 */
export function createTypeScale(fonts: FontFamilies): TypeScale {
  return {
    /** The VINCO wordmark. */
    hero: {
      fontFamily: fonts.display,
      fontSize: 64,
      lineHeight: 72,
      letterSpacing: 14,
      defaultColor: 'text',
      maxFontSizeMultiplier: 1,
    },
    /** The giant day number on the day card. */
    numeral: {
      fontFamily: fonts.display,
      fontSize: 96,
      lineHeight: 100,
      defaultColor: 'text',
      maxFontSizeMultiplier: 1,
    },
    /** Big stats: reel count, minutes. */
    display: {
      fontFamily: fonts.display,
      fontSize: 40,
      lineHeight: 46,
      defaultColor: 'text',
      maxFontSizeMultiplier: 1.2,
    },
    /** Screen titles. */
    title: {
      fontFamily: fonts.display,
      fontSize: 30,
      lineHeight: 36,
      defaultColor: 'text',
      maxFontSizeMultiplier: 1.3,
    },
    /** Sheet titles, rank names, card headings. */
    heading: {
      fontFamily: fonts.display,
      fontSize: 22,
      lineHeight: 28,
      defaultColor: 'text',
      maxFontSizeMultiplier: 1.4,
    },
    /** Stoic and Latin quotes. */
    quote: {
      fontFamily: fonts.display,
      fontSize: 20,
      lineHeight: 27,
      defaultColor: 'text',
      maxFontSizeMultiplier: 1.4,
    },
    /** Small inscription above a title: "DAY XII OF LX". */
    eyebrow: {
      fontFamily: fonts.display,
      fontSize: 13,
      lineHeight: 18,
      letterSpacing: 1.6,
      textTransform: 'uppercase',
      defaultColor: 'textMuted',
      maxFontSizeMultiplier: 1.4,
    },
    bodyLarge: {
      fontFamily: fonts.body,
      fontSize: 16,
      lineHeight: 24,
      defaultColor: 'text',
      maxFontSizeMultiplier: 1.6,
    },
    body: {
      fontFamily: fonts.body,
      fontSize: 15,
      lineHeight: 22,
      defaultColor: 'text',
      maxFontSizeMultiplier: 1.6,
    },
    /** Task names, card titles. */
    label: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 16,
      lineHeight: 22,
      defaultColor: 'text',
      maxFontSizeMultiplier: 1.5,
    },
    /** Inline actions like "+1 L". */
    labelSmall: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 13,
      lineHeight: 18,
      defaultColor: 'text',
      maxFontSizeMultiplier: 1.5,
    },
    button: {
      fontFamily: fonts.bodyBold,
      fontSize: 16,
      lineHeight: 20,
      defaultColor: 'text',
      maxFontSizeMultiplier: 1.3,
    },
    caption: {
      fontFamily: fonts.body,
      fontSize: 13,
      lineHeight: 18,
      defaultColor: 'textMuted',
      maxFontSizeMultiplier: 1.6,
    },
    /** Section headers: "YOUR ORDERS". */
    overline: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 13,
      lineHeight: 18,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      defaultColor: 'textMuted',
      maxFontSizeMultiplier: 1.4,
    },
    /** Tab plain labels, legends, badges. */
    micro: {
      fontFamily: fonts.body,
      fontSize: 11,
      lineHeight: 14,
      defaultColor: 'textMuted',
      maxFontSizeMultiplier: 1.4,
    },
  };
}
