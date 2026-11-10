import { createElement } from './storefront.js';

const makeHeading = (content, style = {}) =>
  createElement('heading', {
    content,
    style: {
      fontSize: 36,
      fontWeight: 'bold',
      color: '#202820',
      textAlign: 'left',
      ...style,
    },
  });

const makeText = (content, style = {}) =>
  createElement('text', {
    content,
    style: {
      fontSize: 16,
      color: '#555B55',
      textAlign: 'left',
      ...style,
    },
  });

const makeButton = (content, link = '', style = {}) =>
  createElement('button', {
    content,
    action: link
      ? {
          type: link.startsWith('http') ? 'external' : 'page',
          value: link,
        }
      : { type: 'none' },
    style: {
      fontSize: 14,
      fontWeight: 'semibold',
      backgroundColor: '#202820',
      color: '#FFFFFF',
      padding: '12px 22px',
      borderRadius: '6px',
      ...style,
    },
  });

const makeImage = (src, alt = '') =>
  createElement('image', {
    src: src || '',
    content: '',
    settings: { alt },
    style: {
      width: '100%',
      height: 'auto',
      objectFit: 'cover',
    },
  });

/**
 * Converts supported legacy section settings into native,
 * independently editable storefront elements.
 *
 * Dynamic sections remain intact so live products, services,
 * bookings, testimonials and navigation continue to work.
 */
export function createEditableTemplateSection(section) {
  const settings = { ...(section.settings || {}) };
  const elements = [];

  const alignment = ['left', 'center', 'right'].includes(settings.alignment)
    ? settings.alignment
    : 'left';

  const textColor = settings.textColor || '#202820';
  const mutedColor = settings.mutedColor || '#555B55';
  const buttonColor = settings.buttonColor || '#202820';
  const buttonTextColor = settings.buttonTextColor || '#FFFFFF';

  switch (section.type) {
    case 'hero': {
      if (settings.eyebrow) {
        elements.push(
          makeText(settings.eyebrow, {
            fontSize: 12,
            fontWeight: 'semibold',
            color: settings.eyebrowColor || mutedColor,
            textAlign: alignment,
          })
        );
      }

      if (settings.title) {
        elements.push(
          makeHeading(settings.title, {
            fontSize: 48,
            fontWeight: 'bold',
            color: settings.heroTextColor || textColor,
            textAlign: alignment,
          })
        );
      }

      if (settings.subtitle) {
        elements.push(
          makeText(settings.subtitle, {
            fontSize: 18,
            color: settings.heroSubtitleColor || mutedColor,
            textAlign: alignment,
          })
        );
      }

      if (settings.buttonText) {
        elements.push(
          makeButton(settings.buttonText, settings.buttonLink, {
            backgroundColor: buttonColor,
            color: buttonTextColor,
          })
        );
      }

      settings.editableContent = true;
      break;
    }

    case 'about':
    case 'image_text': {
      if (settings.image) {
        elements.push(
          makeImage(settings.image, settings.title || 'Section image')
        );
      }

      if (settings.title) {
        elements.push(
          makeHeading(settings.title, {
            color: textColor,
          })
        );
      }

      if (settings.subtitle) {
        elements.push(
          makeText(settings.subtitle, {
            fontSize: 18,
            color: mutedColor,
          })
        );
      }

      if (settings.description) {
        elements.push(
          makeText(settings.description, {
            color: mutedColor,
          })
        );
      }

      settings.editableContent = true;
      break;
    }

    case 'rich_text':
    case 'custom_content': {
      if (settings.title) {
        elements.push(
          makeHeading(settings.title, {
            color: textColor,
          })
        );
      }

      if (settings.subtitle) {
        elements.push(
          makeText(settings.subtitle, {
            fontSize: 18,
            color: mutedColor,
          })
        );
      }

      const body = settings.content || settings.description;

      if (body) {
        elements.push(
          makeText(body, {
            color: mutedColor,
          })
        );
      }

      settings.editableContent = true;
      break;
    }

    case 'announcement': {
      if (settings.text) {
        elements.push(
          makeText(settings.text, {
            fontSize: 13,
            fontWeight: 'semibold',
            textAlign: 'center',
            color: settings.textColor || '#FFFFFF',
          })
        );
      }

      settings.editableContent = true;
      break;
    }

    case 'footer': {
      if (settings.text) {
        elements.push(
          makeText(settings.text, {
            textAlign: 'center',
            color: mutedColor,
          })
        );
      }

      settings.editableContent = true;
      break;
    }

    default:
      return {
        ...section,
        settings,
        elements: section.elements || [],
      };
  }

  return {
    ...section,
    settings,
    elements,
  };
}
