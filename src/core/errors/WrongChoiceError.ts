class WrongChoiceError extends Error {
  constructor(message = "Incorrect choice") {
    super(message);
    this.name = "IncorrectChoice";
  }
}

export default WrongChoiceError;
