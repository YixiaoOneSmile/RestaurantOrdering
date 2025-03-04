export function getDishName(dish, locale) {
  if (locale.startsWith('zh')) {
    return dish.nameCN;
  } else if (locale.startsWith('ja')) {
    return dish.nameJP;
  } else {
    return dish.name;
  }
}