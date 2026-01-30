const lms_base = "http://local.openedx.io:8000/";

export const Header = ({ showExit = true, urlExit = lms_base }) => {
  return (
    <header className="bg-white border-b">
      <div className="mx-auto flex items-center justify-between px-6 py-4">
        <a className="flex items-center gap-4" href={urlExit || lms_base}>
          <img src="/images/logo_ctu.png" alt="CTU" className="h-10" />
          <img src="/images/logo_cusc.png" alt="CUSC" className="h-10" />

          <div className="font-semibold text-lg text-cusc_blue">
            My Open edX
          </div>
        </a>

        {showExit && (
          <button
            className="text-sm text-cusc_blue p-2 hover:text-black border-none bg-transparent"
            onClick={() => (window.location.href = urlExit)}
          >
            Huỷ
          </button>
        )}
      </div>
    </header>
  );
};
