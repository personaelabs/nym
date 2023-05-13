import Spinner from './Spinner';

export const MainButton = (props: {
  color: string;
  message: string;
  loading: boolean;
  handler: () => void;
}) => {
  const { color, message, loading, handler } = props;

  return (
    <button
      className={`font-bold bg-${color} text-white px-4 py-2.5 rounded-xl hover:scale-105 active:scale-100 transition-all`}
      onClick={handler}
    >
      {loading ? <Spinner /> : <p>{message}</p>}
    </button>
  );
};
