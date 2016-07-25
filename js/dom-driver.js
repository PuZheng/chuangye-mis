import morphdom from 'morphdom';

export function mount(slot, node, cb) {
  slot.change(newNode => {
    morphdom(node, newNode);
    cb(node);
  });
};

