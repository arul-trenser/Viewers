import React from 'react';
import PropTypes from 'prop-types';
import Typography from '../Typography';
import { Icons } from '@ohif/ui-next';
import CustomizableRenderComponent from '../../utils/CustomizableRenderComponent';

const ContextMenu = ({ items, ...props }) => {
  if (!items) {
    return null;
  }
  return (
    <div
      data-cy="context-menu"
      className={
        'bg-secondary-dark relative z-50 block w-48 rounded ' + props?.contentProps?.customClassName
      }
      onContextMenu={e => e.preventDefault()}
    >
      {items.map((item, index) => {
        const itemProps = { item, index, ...props };
        return CustomizableRenderComponent({
          customizationId: 'ui.ContextMenuItem',
          FallbackComponent: FallbackContextMenuItem,
          ...itemProps,
        });
      })}
    </div>
  );
};

ContextMenu.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      action: PropTypes.func.isRequired,
    })
  ),
};

const FallbackContextMenuItem = ({ index, item, ...props }) => {
  return (
    <div
      key={index}
      data-cy="context-menu-item"
      onClick={() => item.action(item, props)}
      style={{ justifyContent: 'space-between' }}
      className="hover:bg-primary-dark border-primary-dark flex cursor-pointer items-center border-b px-4 py-3 transition duration-300 last:border-b-0"
    >
      <Typography>{item.label}</Typography>
      {item.iconRight && (
        <Icon
          name={item.iconRight}
          className="inline"
        />
      )}
    </div>
  );
};

FallbackContextMenuItem.propTypes = {
  index: PropTypes.number.isRequired,
  item: PropTypes.shape({
    label: PropTypes.string.isRequired,
    action: PropTypes.func.isRequired,
    iconRight: PropTypes.string,
  }),
};

export default ContextMenu;
