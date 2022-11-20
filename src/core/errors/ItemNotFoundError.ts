class ItemNotFoundError extends Error {
  constructor(message = "Item not found") {
    super(message);
    this.name = "ItemNotFound";
  }
}

export default ItemNotFoundError;
