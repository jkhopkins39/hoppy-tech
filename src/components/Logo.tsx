/*
The logo component will contain the following:
- A square thumbnail
- A square clickable area to take you to the Home page
*/

import { Link } from "react-router-dom";
import { LETTERMARK_URL, WEBSITE_LOGO_ALT } from "../config/brand";

const Logo = () => {
  return (
    <Link to="/" className="inline-block">
      <img
        src={LETTERMARK_URL}
        alt={WEBSITE_LOGO_ALT}
        className="brand-lettermark h-10 w-auto sm:h-11 md:h-12 transition-all duration-300 ease-in-out hover:scale-105"
      />
    </Link>
  );
};

export default Logo;
