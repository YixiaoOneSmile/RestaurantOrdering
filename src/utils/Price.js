function formatPrice (row) 
{
    const symbols = {
      CNY: "C¥",
      JPY: "J¥",
      USD: "$",
    };
  return `${symbols[row.currency]}`;
}



module.exports ={ formatPrice}