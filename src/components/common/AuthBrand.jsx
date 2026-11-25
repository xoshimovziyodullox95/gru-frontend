// Kirish / ro'yxatdan o'tish sahifalari tepasidagi ZUMO logotipi (bosh sahifa sarlavhasidagi bilan bir xil:
// "Z" rasmi + "UMO" gradient yozuv)
export default function AuthBrand() {
  return (
    <div className="am-brand" aria-label="ZUMO">
      <img src="/ZUMO.png" alt="" className="am-brand__z" />
      <span className="am-brand__umo">UMO</span>
    </div>
  );
}
