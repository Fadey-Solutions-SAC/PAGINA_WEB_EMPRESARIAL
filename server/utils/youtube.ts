export function youtubeEmbed(url: string) {
  try {
    const u = new URL(url);
    let id = "";
    if (u.hostname.includes("youtu.be")) id = u.pathname.slice(1);
    else if (u.searchParams.get("v")) id = u.searchParams.get("v") || "";
    else if (u.pathname.includes("/embed/")) id = u.pathname.split("/embed/")[1];
    if (!id) return url;
    return `https://www.youtube-nocookie.com/embed/${id}`;
  } catch {
    return url;
  }
}
