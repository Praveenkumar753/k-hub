
# Simulated input
input_lines = ["3 4"]
input_index = 0

def input():
    global input_index
    if input_index < len(input_lines):
        line = input_lines[input_index]
        input_index += 1
        return line
    return ""

a,b=map(int,input().split())
print(a+b)