import morphdom from 'morphdom';

const mount = function mount(slot, node, cb) {
  slot.change(newNode => {
    morphdom(node, newNode);
    cb(node);
  });
};

export default {
  mount,
};


