export const logContext = ({ context, self }) => {
  console.log(self.getSnapshot().value, context);
};
