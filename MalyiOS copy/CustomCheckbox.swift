import SwiftUI

struct CustomCheckbox: View {
    @Binding var isOn: Bool
    let label: String
    var subtext: String? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 12) {
                Button(action: {
                    isOn.toggle()
                }) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 4)
                            .stroke(Color.white.opacity(0.5), lineWidth: 1)
                            .frame(width: 20, height: 20)
                            .background(isOn ? Color.white : Color.clear)
                            .cornerRadius(4)
                        
                        if isOn {
                            Image(systemName: "checkmark")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundColor(.black)
                        }
                    }
                }
                
                Text(label)
                    .font(.system(size: 16))
                    .foregroundColor(.white)
                
                Spacer()
            }
            
            if let subtext = subtext, !subtext.isEmpty {
                Text(subtext)
                    .font(.system(size: 14))
                    .foregroundColor(Color.gray.opacity(0.7))
                    .padding(.leading, 32) // Align with the label text
            }
        }
    }
}