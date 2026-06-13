import { useCrackMode } from '../context/CrackModeContext';

const CrackModeExit: React.FC = () => {
  const { isCrackMode, disableCrackMode } = useCrackMode();

  if (!isCrackMode) return null;

  return (
    <button
      type="button"
      className="crack-mode-exit"
      onClick={disableCrackMode}
      aria-label="Exit crack mode and return to normal design"
    >
      🧠 Return to Sanity
    </button>
  );
};

export default CrackModeExit;
